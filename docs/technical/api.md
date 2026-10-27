# StreamSound · API 接口规范文档

> 本服务面向局域网自托管场景，**所有接口均不鉴权**：没有登录、没有 JWT/Token、没有用户体系，任何能访问该端口的客户端都可直接调用。请仅在可信内网中部署。

---

## 目录

1. [通用约定](#1-通用约定)
2. [错误码体系](#2-错误码体系)
3. [音乐库模块 `/library`](#3-音乐库模块-library)
4. [音频流模块 `/stream`](#4-音频流模块-stream)
5. [封面图模块 `/covers`](#5-封面图模块-covers)
6. [搜索模块 `/search`](#6-搜索模块-search)
7. [收藏模块 `/favorites`](#7-收藏模块-favorites)
8. [播放历史模块 `/history`](#8-播放历史模块-history)
9. [扫描模块 `/scan`](#9-扫描模块-scan)

---

## 1. 通用约定

### 1.1 基础信息

| 项目 | 说明 |
|------|------|
| 协议 | HTTP / HTTPS |
| Base URL | `http://<server-ip>:<port>` （由 App 用户配置，默认 `http://<server-ip>:8080`） |
| 数据格式 | JSON（`Content-Type: application/json`） |
| 字符编码 | UTF-8 |
| 时间格式 | Unix 时间戳（秒），整型 |
| 鉴权 | 无；所有接口在局域网内开放 |

### 1.2 鉴权方式

无。服务端不校验任何身份信息，请求无需携带 `Authorization`、Cookie 或其他凭据；响应也不会下发 Token。安全边界完全依赖部署环境（可信局域网、防火墙或外层 VPN/反向代理）。

### 1.3 标准响应结构

**成功响应**

```json
{
  "data": { ... }
}
```

**分页响应**

```json
{
  "data": [ ... ],
  "pagination": {
    "total": 200,
    "limit": 50,
    "offset": 0
  }
}
```

**错误响应**

```json
{
  "error": {
    "code": "LIB_002",
    "message": "曲目不存在",
    "detail": "Track not found"
  }
}
```

### 1.4 分页参数

支持分页的接口均接受以下 Query 参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | integer | 50 | 每页数量，最大 200 |
| `offset` | integer | 0 | 偏移量 |

---

## 2. 错误码体系

### 2.1 错误响应 HTTP 状态码

| HTTP 状态码 | 含义 |
|------------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复收藏、扫描任务进行中） |
| 500 | 服务端内部错误 |

### 2.2 业务错误码

#### LIBRARY 音乐库相关

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `LIB_001` | 404 | 文件夹不存在 |
| `LIB_002` | 404 | 曲目不存在 |
| `LIB_003` | 500 | 音乐库尚未完成扫描 |

#### STREAM 音频流相关

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `STREAM_001` | 404 | 曲目不存在 |
| `STREAM_002` | 500 | 音频文件读取失败（文件被移动或删除） |
| `STREAM_003` | 400 | Range 请求格式错误 |

#### SEARCH 搜索相关

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `SEARCH_001` | 400 | 搜索关键词为空或长度超过 100 字符 |

#### FAV 收藏相关

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `FAV_001` | 404 | 曲目不存在，无法收藏 |
| `FAV_002` | 409 | 该曲目已在收藏列表中 |
| `FAV_003` | 404 | 该曲目不在收藏列表中，无法取消 |

#### HISTORY 历史相关

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `HIST_001` | 404 | 曲目不存在，无法上报 |

#### SCAN 扫描相关

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `SCAN_001` | 409 | 扫描任务正在进行中，请勿重复触发 |
| `SCAN_002` | 400 | 音乐文件夹路径无效或不存在 |

---

## 3. 音乐库模块 `/library`

### 数据模型

**Folder 对象**

```json
{
  "id": 3,
  "name": "日语歌曲",
  "path": "/music/日语歌曲",
  "parentId": null,
  "trackCount": 42
}
```

**Track 对象（列表项）**

```json
{
  "id": 101,
  "title": "なんでもないや",
  "artist": "RADWIMPS",
  "album": "君の名は。",
  "duration": 258,
  "hasCover": true,
  "hasLyrics": true,
  "folderId": 3
}
```

**Track 对象（详情，含歌词）**

```json
{
  "id": 101,
  "title": "なんでもないや",
  "artist": "RADWIMPS",
  "album": "君の名は。",
  "duration": 258,
  "bitrate": 320,
  "sampleRate": 44100,
  "mimeType": "audio/mpeg",
  "fileSize": 10485760,
  "hasCover": true,
  "hasLyrics": true,
  "lyrics": "[00:12.00]なんでもないや\n[00:15.50]君のことを思い出す",
  "folderId": 3,
  "isFavorited": true
}
```

> `isFavorited` 为全局状态：仅按 `track_id` 在 `favorites` 表中是否存在计算，没有「当前用户」概念。

---

### 3.1 获取文件夹列表 `GET /library/folders`

**Query 参数**：无（全量返回，文件夹数量通常不大）

**成功响应** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "name": "全部音乐",
      "path": "/music",
      "parentId": null,
      "trackCount": 312
    },
    {
      "id": 2,
      "name": "日语歌曲",
      "path": "/music/日语歌曲",
      "parentId": 1,
      "trackCount": 42
    }
  ]
}
```

> `id: 1` 的「全部音乐」始终作为第一项返回，代表根目录聚合视图。

---

### 3.2 获取文件夹内曲目 `GET /library/folders/:id/tracks`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 文件夹 ID |

**Query 参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | integer | 50 | 每页数量 |
| `offset` | integer | 0 | 偏移量 |
| `sort` | string | `title` | 排序字段：`title` / `artist` / `duration` |
| `order` | string | `asc` | 排序方向：`asc` / `desc` |

**成功响应** `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "title": "なんでもないや",
      "artist": "RADWIMPS",
      "album": "君の名は。",
      "duration": 258,
      "hasCover": true,
      "hasLyrics": true,
      "folderId": 2
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 50,
    "offset": 0
  }
}
```

**错误响应**

| 错误码 | 场景 |
|--------|------|
| `LIB_001` | 文件夹 ID 不存在 |

---

### 3.3 获取曲目详情 `GET /library/tracks/:id`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 曲目 ID |

**成功响应** `200 OK`

```json
{
  "data": {
    "id": 101,
    "title": "なんでもないや",
    "artist": "RADWIMPS",
    "album": "君の名は。",
    "duration": 258,
    "bitrate": 320,
    "sampleRate": 44100,
    "mimeType": "audio/mpeg",
    "fileSize": 10485760,
    "hasCover": true,
    "hasLyrics": true,
    "lyrics": "[00:12.00]なんでもないや\n[00:15.50]...",
    "folderId": 2,
    "isFavorited": true
  }
}
```

**错误响应**

| 错误码 | 场景 |
|--------|------|
| `LIB_002` | 曲目 ID 不存在 |

---

## 4. 音频流模块 `/stream`

### 4.1 获取音频流 `GET /stream/:id`

**鉴权**：无。桌面端由桥接进程启动的本地媒体代理转发请求（`127.0.0.1` 随机端口，路径含随机 secret），代理不注入任何 `Authorization` 头，仅透传 `Range`。

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 曲目 ID |

**请求头（可选）**

```
Range: bytes=<start>-<end>
```

**响应说明**

| 场景 | 状态码 | 说明 |
|------|--------|------|
| 无 Range 头或 `Range: bytes=0-` | 206 | 从头传输全部内容 |
| 指定 Range | 206 | 返回对应字节段 |
| Range 超出文件大小 | 416 | Range Not Satisfiable |

**成功响应头** `206 Partial Content`

```
Content-Type: audio/mpeg
Content-Length: 5242880
Content-Range: bytes 0-5242879/10485760
Accept-Ranges: bytes
```

> 响应体为二进制音频数据，无 JSON 包装。

**错误响应**

| 错误码 | 场景 |
|--------|------|
| `STREAM_001` | 曲目 ID 不存在 |
| `STREAM_002` | 服务端文件读取失败 |
| `STREAM_003` | Range 格式错误 |

---

## 5. 封面图模块 `/covers`

### 5.1 获取封面图 `GET /covers/:id`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 曲目 ID |

**成功响应** `200 OK`

响应体为图片二进制数据。

```
Content-Type: image/jpeg   （或 image/png，取决于内嵌封面格式）
Cache-Control: public, max-age=86400
```

**无封面时** `404 Not Found`

> 客户端收到 404 时应显示默认占位图，不应报错。

---

## 6. 搜索模块 `/search`

### 6.1 全局搜索 `GET /search`

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `q` | string | 是 | 搜索关键词，最大 100 字符 |
| `limit` | integer | 否 | 每类结果最大数量，默认 20，最大 50 |

**成功响应** `200 OK`

```json
{
  "data": {
    "tracks": [
      {
        "id": 101,
        "title": "なんでもないや",
        "artist": "RADWIMPS",
        "album": "君の名は。",
        "duration": 258,
        "hasCover": true,
        "highlight": {
          "title": "なんでも<em>ない</em>や"
        }
      }
    ],
    "artists": [
      {
        "name": "RADWIMPS",
        "trackCount": 15,
        "highlight": {
          "name": "<em>RADWIMPS</em>"
        }
      }
    ],
    "albums": [
      {
        "name": "君の名は。",
        "artist": "RADWIMPS",
        "trackCount": 8,
        "highlight": {
          "name": "君の<em>名</em>は。"
        }
      }
    ]
  }
}
```

> `highlight` 字段中，匹配的关键词片段用 `<em>` 标签包裹，客户端负责渲染高亮样式。

**错误响应**

| 错误码 | 场景 |
|--------|------|
| `SEARCH_001` | `q` 参数缺失或长度超限 |

---

## 7. 收藏模块 `/favorites`

> 收藏为全局数据，没有用户维度；是否已收藏仅由 `track_id` 决定。

### 7.1 获取收藏列表 `GET /favorites`

**Query 参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | integer | 50 | 每页数量 |
| `offset` | integer | 0 | 偏移量 |

**成功响应** `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "title": "なんでもないや",
      "artist": "RADWIMPS",
      "album": "君の名は。",
      "duration": 258,
      "hasCover": true,
      "favoritedAt": 1720000000
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 50,
    "offset": 0
  }
}
```

> 默认按 `favoritedAt` 降序排列（最新收藏在前）。

---

### 7.2 收藏曲目 `POST /favorites/:id`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 曲目 ID |

**请求体**：无

**成功响应** `201 Created`

```json
{
  "data": {
    "trackId": 101,
    "favoritedAt": 1720000000
  }
}
```

**错误响应**

| 错误码 | 场景 |
|--------|------|
| `FAV_001` | 曲目 ID 不存在 |
| `FAV_002` | 该曲目已在收藏中 |

---

### 7.3 取消收藏 `DELETE /favorites/:id`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 曲目 ID |

**成功响应** `200 OK`

```json
{
  "data": {
    "trackId": 101
  }
}
```

**错误响应**

| 错误码 | 场景 |
|--------|------|
| `FAV_003` | 该曲目不在收藏列表中 |

---

## 8. 播放历史模块 `/history`

> 播放历史为全局数据，没有用户维度；同一曲目只保留一条最新记录。

### 8.1 获取播放历史 `GET /history`

**Query 参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | integer | 50 | 最大 50（历史上限为 50 条） |
| `offset` | integer | 0 | 偏移量 |

**成功响应** `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "title": "なんでもないや",
      "artist": "RADWIMPS",
      "album": "君の名は。",
      "duration": 258,
      "hasCover": true,
      "playedAt": 1720000000
    }
  ],
  "pagination": {
    "total": 23,
    "limit": 50,
    "offset": 0
  }
}
```

> 按 `playedAt` 降序排列，同一曲目重复播放时仅保留最新时间戳，不重复出现。

---

### 8.2 上报播放记录 `POST /history/:id`

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | integer | 曲目 ID |

**请求体**：无

**触发时机建议**：播放进度超过 30 秒，或播放完成时触发。避免在切歌瞬间立即上报。

**成功响应** `200 OK`

```json
{
  "data": {
    "trackId": 101,
    "playedAt": 1720000000
  }
}
```

**错误响应**

| 错误码 | 场景 |
|--------|------|
| `HIST_001` | 曲目 ID 不存在 |

---

## 9. 扫描模块 `/scan`

> 扫描接口无任何权限校验，局域网内可直接调用。扫描在服务端后台异步执行。

### 9.1 获取音乐根目录 `GET /scan/music-root`

**成功响应** `200 OK`

```json
{
  "data": {
    "musicRoot": "/home/<user>/Music"
  }
}
```

> 返回服务端当前配置的 `MUSIC_ROOT`。

---

### 9.2 触发音乐库扫描 `POST /scan`

**请求体**（可选）

```json
{
  "musicRoot": "/home/<user>/Music"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `musicRoot` | string | 否 | 本次扫描使用的音乐目录；省略时使用服务端配置的 `MUSIC_ROOT` |

**成功响应** `202 Accepted`

```json
{
  "data": {
    "status": "started",
    "message": "扫描任务已启动，将在后台异步执行"
  }
}
```

> 返回 `202` 表示任务已加入队列，不等待扫描完成。客户端可轮询扫描状态（见 9.3）。

**错误响应**

| 错误码 | 场景 |
|--------|------|
| `SCAN_001` | 扫描任务已在进行中 |
| `SCAN_002` | 指定的 `musicRoot` 路径无效或不存在 |

---

### 9.3 获取扫描状态 `GET /scan/status`

**成功响应** `200 OK`

```json
{
  "data": {
    "status": "running",
    "progress": {
      "scanned": 150,
      "total": 312,
      "added": 12,
      "updated": 3,
      "removed": 1
    },
    "startedAt": 1720000000,
    "finishedAt": null
  }
}
```

| `status` 值 | 说明 |
|-------------|------|
| `idle` | 无扫描任务 |
| `running` | 扫描进行中 |
| `finished` | 上次扫描已完成 |
| `error` | 上次扫描异常终止 |

---

*StreamSound · API 接口规范文档 · 内部文档*
