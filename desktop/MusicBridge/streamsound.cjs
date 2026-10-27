// StreamSound 桌面端桥接进程。
// 只通过父子进程私有管道收发 JSON，不写日志。
// 数据来自 StreamSound 自建服务（LAN 内无鉴权），向上层输出 Rhine 已能解析的结构。
'use strict';

for (const name of ['log', 'info', 'warn', 'error', 'debug', 'trace']) {
    console[name] = () => {};
}

const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');
const readline = require('node:readline');

// 后端地址由偏好经环境变量下发；缺省指向 LAN 内的自建服务，首启即可使用。
const BASE = (process.env.STREAMSOUND_SERVER || 'http://<server-ip>:8080').replace(/\/+$/, '');
const SECRET = crypto.randomBytes(18).toString('hex');
const PAGE = 100;

let port = 0;
let proxyReady = null;

function proxyUrl(kind, id) {
    return `http://127.0.0.1:${port}/${SECRET}/${kind}/${encodeURIComponent(id)}`;
}

/** 服务端统一返回 {data, pagination} 或 {error:{message}}；无鉴权，不附带任何凭据。 */
async function request(path, options = {}) {
    const method = options.method || 'GET';
    const headers = { Accept: 'application/json' };
    if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    let response;
    try {
        response = await fetch(BASE + path, {
            method,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
        });
    } catch {
        return { status: 0, data: null, message: '音乐服务不可达' };
    }
    let data = null;
    const text = await response.text().catch(() => '');
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = null;
        }
    }
    const message = (data && data.error && data.error.message) || (data && data.message) || '';
    return { status: response.status, data, message };
}

/** 服务端无鉴权，直接透传请求即可。 */
async function api(path, options = {}) {
    return request(path, options);
}

function failure(result) {
    if (result.status === 0) {
        return { code: 503, message: '音乐服务不可达' };
    }
    return { code: result.status || 500, message: result.message || `服务返回 ${result.status}` };
}

function payload(result) {
    return result.data && result.data.data !== undefined ? result.data.data : null;
}

function pagination(result) {
    return (result.data && result.data.pagination) || { total: 0, limit: PAGE, offset: 0 };
}

/** 与 Rhine 的 items.mjs 保持同一资料库模型，key 以 streamsound 为前缀。 */
function item(kind, id, title, artist) {
    return {
        kind,
        id: String(id),
        title,
        artist,
        artists: [],
        creatorID: '',
        albumID: '',
        album: '',
        cover: '',
        description: '',
        wiki: '',
        date: '',
        duration: 0,
        trackCount: 0,
        provider: 'streamsound',
        key: `streamsound:${kind}:${id}`,
    };
}

function songItem(track) {
    const id = String(track.id);
    const value = item('song', id, track.title || '未知曲目', track.artist || '未知');
    value.artists = track.artist ? [{ id: String(track.artist), name: String(track.artist) }] : [];
    value.albumID = String(track.album || '');
    value.album = track.album || '';
    value.cover = track.hasCover ? proxyUrl('covers', id) : '';
    value.duration = Math.round((Number(track.duration) || 0) * 1000);
    return value;
}

function playlistItem(folder) {
    const id = String(folder.id);
    const value = item('playlist', id, folder.name || '文件夹', 'StreamSound');
    value.trackCount = Number(folder.trackCount) || 0;
    value.description = folder.path || '';
    value.creatorID = '0';
    return value;
}

function page(items, rawCount, total, more) {
    return { items, rawCount, total, more: !!more };
}

async function fetchTrack(id) {
    const result = await api(`/library/tracks/${encodeURIComponent(id)}`);
    if (result.status !== 200) {
        return null;
    }
    return payload(result);
}

/** 曲目详情按小批量并发读取，保持调用方给定的顺序。 */
async function fetchTracks(ids) {
    const songs = new Array(ids.length).fill(null);
    for (let start = 0; start < ids.length; start += 4) {
        const batch = ids.slice(start, start + 4);
        const values = await Promise.all(batch.map((id) => fetchTrack(id)));
        values.forEach((value, index) => {
            songs[start + index] = value;
        });
    }
    return songs.filter(Boolean).map(songItem);
}

async function folderDetail(id) {
    const folders = await api('/library/folders');
    const list = payload(folders) || [];
    const folder = list.find((entry) => String(entry.id) === String(id)) || {
        id,
        name: '文件夹',
        path: '',
        trackCount: 0,
    };
    const result = await api(
        `/library/folders/${encodeURIComponent(id)}/tracks?limit=200&offset=0&sort=title&order=asc`,
    );
    if (result.status !== 200) {
        throw result;
    }
    const songs = (payload(result) || []).map(songItem);
    return [playlistItem(folder), songs, songs.map((song) => song.id)];
}

async function dispatch(message) {
    const route = String(message.route || '');
    const args = message.params && Array.isArray(message.params.args) ? message.params.args : [];
    const params = message.params && typeof message.params === 'object' ? message.params : {};

    try {
        if (route === '/native/streamsound/server') {
            // 用健康检查探测后端可达性，返回当前使用的服务器地址。
            const result = await request('/health');
            if (result.status !== 200) {
                return { code: 503, message: '音乐服务不可达' };
            }
            return { code: 200, value: BASE };
        }
        if (route === '/native/streamsound/search') {
            const query = String(args[0] || '').trim();
            const start = Number(args[2]) || 0;
            if (!query || start > 0) {
                return { code: 200, value: page([], 0, 0, false) };
            }
            const result = await api(`/search?q=${encodeURIComponent(query)}&limit=50`);
            if (result.status !== 200) {
                return failure(result);
            }
            const data = payload(result) || {};
            const songs = (data.tracks || []).map(songItem);
            return { code: 200, value: page(songs, songs.length, songs.length, false) };
        }
        if (route === '/native/streamsound/songs') {
            const ids = Array.isArray(args[0]) ? args[0].map(String) : [];
            return { code: 200, value: await fetchTracks(ids) };
        }
        if (route === '/native/streamsound/likedIDs') {
            const ids = [];
            let offset = 0;
            for (;;) {
                const result = await api(`/favorites?limit=200&offset=${offset}`);
                if (result.status !== 200) {
                    return failure(result);
                }
                const items = payload(result) || [];
                for (const item of items) {
                    ids.push(String(item.id));
                }
                const meta = pagination(result);
                offset += items.length;
                if (items.length === 0 || offset >= meta.total) {
                    break;
                }
            }
            return { code: 200, value: ids };
        }
        if (route === '/native/streamsound/likedSongs') {
            const offset = Number(args[0]) || 0;
            const result = await api(`/favorites?limit=${PAGE}&offset=${offset}`);
            if (result.status !== 200) {
                return failure(result);
            }
            const items = (payload(result) || []).map(songItem);
            const meta = pagination(result);
            return {
                code: 200,
                value: page(items, items.length, meta.total, offset + items.length < meta.total),
            };
        }
        if (route === '/native/streamsound/folders') {
            const offset = Number(args[0]) || 0;
            const result = await api('/library/folders');
            if (result.status !== 200) {
                return failure(result);
            }
            const all = payload(result) || [];
            const items = all.slice(offset, offset + 50).map(playlistItem);
            return { code: 200, value: page(items, items.length, all.length, offset + items.length < all.length) };
        }
        if (route === '/native/streamsound/history') {
            const offset = Number(args[0]) || 0;
            const result = await api(`/history?limit=${PAGE}&offset=${offset}`);
            if (result.status !== 200) {
                return failure(result);
            }
            const items = (payload(result) || []).map(songItem);
            const meta = pagination(result);
            return {
                code: 200,
                value: page(items, items.length, meta.total, offset + items.length < meta.total),
            };
        }
        if (route === '/native/streamsound/playback' || route === '/native/streamsound/preview') {
            const track = args[0] && typeof args[0] === 'object' ? args[0] : {};
            const id = String(track.id || '');
            if (!id) {
                return { code: 400, message: '曲目信息无效' };
            }
            return {
                code: 200,
                value: {
                    url: proxyUrl('stream', id),
                    level: 'lossless',
                    quality: 'flac',
                    trial: false,
                    freeTrialInfo: null,
                },
            };
        }
        if (route === '/native/streamsound/lyrics') {
            const track = args[0] && typeof args[0] === 'object' ? args[0] : {};
            const detail = await fetchTrack(track.id);
            const lyric = detail && detail.lyrics ? String(detail.lyrics) : '';
            const formatted = require('./lyrics-format.cjs').normalizeLyrics('netease', {
                lrc: { lyric },
            });
            return { code: 200, value: (formatted && formatted.document) || { lines: [] } };
        }
        if (route === '/native/streamsound/wiki') {
            return { code: 200, value: '' };
        }
        if (route === '/native/streamsound/report') {
            const id = String(args[0] || '');
            if (!id) {
                return { code: 400, message: '曲目信息无效' };
            }
            const result = await api(`/history/${encodeURIComponent(id)}`, { method: 'POST', body: {} });
            return result.status === 200 || result.status === 201 ? { code: 200, value: {} } : failure(result);
        }
        if (route === '/native/streamsound/detail') {
            const item = args[0] && typeof args[0] === 'object' ? args[0] : {};
            if (item.kind === 'song') {
                const track = await fetchTrack(item.id);
                if (!track) {
                    return { code: 404, message: '曲目不存在' };
                }
                return { code: 200, value: [songItem(track), [], []] };
            }
            return { code: 200, value: await folderDetail(item.id) };
        }
        if (route === '/streamsound/playlist/detail') {
            return { code: 200, value: await folderDetail(params.id) };
        }
        if (route === '/streamsound/like') {
            const id = String(params.id || '');
            const liked = params.like !== false && params.like !== 0;
            if (!id) {
                return { code: 400, message: '曲目信息无效' };
            }
            const result = await api(`/favorites/${encodeURIComponent(id)}`, { method: liked ? 'POST' : 'DELETE' });
            if (result.status === 200 || result.status === 201 || result.status === 409) {
                return { code: 200, value: {} };
            }
            if (!liked && result.status === 404) {
                return { code: 200, value: {} };
            }
            return failure(result);
        }
        if (route === '/streamsound/history') {
            const id = String(params.id || '');
            if (!id) {
                return { code: 400, message: '曲目信息无效' };
            }
            const result = await api(`/history/${encodeURIComponent(id)}`, { method: 'POST', body: {} });
            return result.status === 200 || result.status === 201 ? { code: 200, value: {} } : failure(result);
        }
        return { code: 404, message: '未知的桥接路由' };
    } catch (result) {
        if (result && typeof result.status === 'number') {
            return failure(result);
        }
        return { code: 500, message: '音乐服务处理失败' };
    }
}

/** 本地媒体代理：透传 Range，避免把内网地址直接交给播放器。 */
async function handleProxy(request_, response) {
    const url = new URL(request_.url, 'http://127.0.0.1');
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 3 || parts[0] !== SECRET) {
        response.statusCode = 404;
        response.end();
        return;
    }
    const kind = parts[1] === 'covers' ? 'covers' : 'stream';
    const target = `${BASE}/${kind}/${encodeURIComponent(parts[2])}`;
    const headers = {};
    if (request_.headers.range) {
        headers.Range = request_.headers.range;
    }
    const module_ = target.startsWith('https:') ? https : http;
    const upstream = module_.request(target, { method: 'GET', headers }, (reply) => {
        response.writeHead(reply.statusCode || 502, reply.headers);
        reply.pipe(response);
    });
    upstream.on('error', () => {
        if (!response.headersSent) {
            response.statusCode = 502;
        }
        response.end();
    });
    request_.on('close', () => upstream.destroy());
    upstream.end();
}

function startProxy() {
    proxyReady = new Promise((resolve) => {
        const server = http.createServer(handleProxy);
        server.on('error', () => resolve());
        server.listen(0, '127.0.0.1', () => {
            port = server.address().port;
            resolve();
        });
    });
}

function output(id, body) {
    // 无鉴权，cookies 恒为空数组；保持协议字段不变，Host 侧解析分支无需改动。
    process.stdout.write(`${JSON.stringify({ id, body, cookies: [] })}\n`);
}

startProxy();

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on('line', (line) => {
    if (!line.trim()) {
        return;
    }
    let message;
    try {
        message = JSON.parse(line);
    } catch {
        return;
    }
    const id = String(message.id || '');
    Promise.resolve(proxyReady)
        .then(() => dispatch(message))
        .then((result) => {
            const body = result && typeof result === 'object' ? result : { code: 500, message: '内部错误' };
            if (body.code === 200 && body.value === undefined) {
                body.value = null;
            }
            output(id, body);
        })
        .catch(() => output(id, { code: 500, message: '内部错误' }));
});
