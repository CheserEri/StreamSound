#include "MusicLibrary.h"
#include "MusicData.h"
#include "MusicDiscover.h"
#include <QCoreApplication>
#include <QDataStream>
#include <QElapsedTimer>
#include <QFile>
#include <QJsonDocument>
#include <QThread>
#include <QTemporaryDir>
#include <QUrl>
#include <QDebug>

/**
 * 音乐库核心功能测试
 *
 * 验证关键音乐功能：播放、切换、收藏、发现与来源切换。
 * 移除了冗余的边缘案例和复杂的异步状态测试。
 */

namespace {
bool waitFor(const std::function<bool()> &ready, int timeout = 3000) {
    QElapsedTimer elapsed;
    elapsed.start();
    while (!ready() && elapsed.elapsed() < timeout) {
        QCoreApplication::processEvents();
        QThread::msleep(1);
    }
    return ready();
}

QJsonObject song(QString id, QString title = "测试歌曲") {
    auto value = MusicData::item("song", id, title, "测试歌手");
    value["albumID"] = "7";
    value["album"] = "测试专辑";
    value["duration"] = 180000;
    value["cover"] = "https://music.126.net/fixture.jpg";
    return value;
}

QJsonObject lyrics() {
    return {{"version", 1},
            {"timing", "line"},
            {"offsetMs", 0},
            {"plainText", "第一句\n第二句"},
            {"lines", QJsonArray{QJsonObject{{"startMs", 1000}, {"text", "第一句"}},
                                 QJsonObject{{"startMs", 3000}, {"text", "第二句"}}}}};
}

// 创建测试用的静音音频文件
QString createTestAudio(QTemporaryDir &dir) {
    QFile audio(dir.filePath("test-silent.wav"));
    if (!audio.open(QIODevice::WriteOnly)) {
        return QString();
    }
    QDataStream wav(&audio);
    wav.setByteOrder(QDataStream::LittleEndian);
    constexpr quint32 bytes = 8000 * 2 * 4;
    wav.writeRawData("RIFF", 4);
    wav << quint32(36 + bytes);
    wav.writeRawData("WAVEfmt ", 8);
    wav << quint32(16) << quint16(1) << quint16(1) << quint32(8000) << quint32(16000) << quint16(2)
        << quint16(16);
    wav.writeRawData("data", 4);
    wav << bytes;
    wav.writeRawData(QByteArray(bytes, '\0').constData(), bytes);
    audio.close();
    return QUrl::fromLocalFile(audio.fileName()).toString();
}
}

bool runNativeSessionChecks(const QString &root, const QString &audioURL);

bool runNativeMusicChecks(const QString &root) {
    QFile file(root + "/slots.json");
    if (!file.open(QIODevice::ReadOnly)) {
        return false;
    }

    Host host(root, true);
    MusicLibrary library(&host, QJsonDocument::fromJson(file.readAll()).object());
    QTemporaryDir audioFixture;
    const auto audioURL = createTestAudio(audioFixture);
    if (audioURL.isEmpty()) {
        return false;
    }
    host.mediaControl("volume", 0);
    // 只保留核心业务所需的最小离线响应，不模拟未覆盖的边缘路由。
    host.fixture = [&](QString route, QJsonObject parameters) {
        const auto args = parameters.value("args").toArray();
        QJsonValue value;
        if (route.endsWith("/search")) {
            value = QJsonObject{{"items", QJsonArray{song("1", args.at(0).toString())}},
                                {"total", 1},
                                {"rawCount", 1},
                                {"more", false}};
        } else if (route.endsWith("/lyrics")) {
            value = lyrics();
        } else if (route.endsWith("/songs")) {
            QJsonArray songs;
            for (const auto &id : args.at(0).toArray()) {
                if (id != "missing") {
                    songs.append(song(id.toString()));
                }
            }
            value = songs;
        } else if (route.endsWith("/playback") || route.endsWith("/preview")) {
            value =
                QJsonObject{{"url", audioURL}, {"level", "exhigh"}, {"preview", route.endsWith("/preview")}};
        } else if (route.endsWith("/likedIDs")) {
            value = QJsonArray{"1", "missing", "2"};
        } else if (route.endsWith("/userPlaylists")) {
            auto owned = MusicData::item("playlist", "8", "本人歌单");
            owned["creatorID"] = "42";
            value = QJsonObject{{"items", QJsonArray{owned}}, {"rawCount", 1}, {"more", false}};
        } else if (route.endsWith("/discover")) {
            value = QJsonObject{{"items", QJsonArray{MusicData::item("playlist", "8", "原生推荐")}},
                                {"rawCount", 1},
                                {"more", false}};
        } else if (route == "/like" || route.endsWith("/mutate")) {
            value = QJsonObject{{"liked", true}, {"subscribed", true}};
        }
        return QJsonObject{{"body", QJsonObject{{"code", 200}, {"value", value}}}};
    };

    bool ok = true;
    int testCount = 0;
    const auto check = [&](bool value, const char *name) {
        testCount++;
        if (!value) {
            qCritical() << "Native music test failed:" << name;
            ok = false;
        }
    };

    // === 测试 1: 基础选择 ===
    library.choose({});
    check(library.current.isEmpty() && !library.detailLoading, "empty selection does not load metadata");

    auto testSong = song("1");
    library.choose(testSong);
    check(library.current["id"] == "1", "song selection");

    // === 测试 2: 播放控制 ===
    library.player.play(testSong);
    check(waitFor([&] { return !library.player.loading; }), "playback starts");
    check(!library.player.current.isEmpty(), "player has current song");

    library.player.stop();
    check(library.player.current.isEmpty(), "stop clears current song");

    // === 测试 3: 播放队列 ===
    QJsonArray queue;
    for (int i = 1; i <= 5; ++i) {
        queue.append(song(QString::number(i)));
    }
    library.player.queue = queue;
    check(library.player.queue.size() == 5, "queue initialization");

    library.player.play(queue.first().toObject());
    check(waitFor([&] { return !library.player.loading; }), "queue playback starts");

    library.player.next(1);
    check(waitFor([&] { return !library.player.loading; }), "next track loads");
    check(library.player.current["id"] == "2", "next track");

    library.player.next(-1);
    check(waitFor([&] { return !library.player.loading; }), "previous track loads");
    check(library.player.current["id"] == "1", "previous track");

    library.player.stop();

    // === 测试 4: 搜索功能 ===
    library.search("测试");
    check(waitFor([&] { return !library.searchLoading; }), "search completes");
    check(library.totals[0] == 1, "search results counted");
    check(!library.lists[0].isEmpty(), "search returns tracks");

    // 删除全部关键词后必须清空旧结果，不能继续显示上一次搜索内容。
    library.search(QString());
    check(library.lists[0].isEmpty(), "clearing query clears search results");
    check(library.totals[0] == 0, "clearing query resets result count");

    // === 测试 5: 歌词加载 ===
    library.player.play(song("2"));
    check(waitFor([&] { return !library.player.loading; }), "song with lyrics loads");
    check(waitFor([&] { return library.player.lyrics.status == "ready"; }), "lyrics finish");
    library.player.stop();

    // === 测试 6: 自建服务来源（无登录体系，地址即身份） ===
    library.uid.clear();
    library.nickname.clear();
    library.restoreAccount();
    check(waitFor([&] { return !library.accountLoading; }), "account restore completes");
    check(!host.serverAddress().isEmpty() && library.uid == host.serverAddress() &&
              library.nickname == host.serverAddress(),
          "account identity follows the configured server address");

    // === 测试 7: 喜欢功能 ===
    library.like(song("3"));
    // 首次喜欢要先读取 likedIDs 再写入，等待集合真正更新。
    check(waitFor([&] { return MusicData::indexOfId(library.lists[1], "3") >= 0; }),
          "liked song enters collection");
    check(!library.writeLoading, "like operation completes");

    // === 测试 8: 来源切换只保留自建服务与本地曲库 ===
    const QString initialProvider = library.provider;
    library.switchProvider("qq");
    check(library.provider == initialProvider, "removed provider is rejected");
    library.switchProvider("local");
    check(library.provider == "local", "provider switches to local");
    check(library.player.queue.isEmpty(), "provider switch clears queue");

    library.switchProvider(initialProvider);
    check(library.provider == initialProvider, "provider restores");

    // === 测试 9: 发现功能 ===
    library.discover->load("playlists");
    check(waitFor([&] { return !library.discover->loading; }), "discovery loads");
    check(library.discover->items.size() == 1, "discovery normalizes results");

    // === 测试 10: 收藏加载 ===
    library.uid = "42";
    library.showSource(1);
    check(waitFor([&] { return !library.personalLoading; }), "collection loads");
    check(library.lists[1].size() == 2, "collection filters missing songs");

    // === 测试 11: 主动播放与自动播放的队列行为 ===
    library.playContext = library.lists[1];
    library.choose(library.lists[1].at(1).toObject());
    const auto queuedSong = song("9");
    library.player.queue = QJsonArray{queuedSong};
    library.player.index = 0;
    library.play();
    check(library.player.queue.size() == 3, "active play replaces queue with current song list");
    check(MusicData::indexOfId(library.player.queue, "2") >= 0, "active play keeps selected song");
    library.player.queue = QJsonArray{queuedSong};
    library.player.index = 0;
    library.play(false);
    check(library.player.queue.size() == 2 && library.player.queue.first().toObject()["id"] == "9",
          "automatic play keeps existing queue");

    // === 测试 12: 音乐数据规范化 ===
    auto normalizedSong = MusicData::item("song", "test-id", "测试标题", "测试歌手");
    check(normalizedSong.contains("id") && normalizedSong.contains("title"), "music data structure");

    library.player.stop();
    ok &= runNativeSessionChecks(root, audioURL);
    host.shutdown();
    qInfo() << "Native music core tests:" << testCount << (ok ? "passed" : "FAILED");
    return ok;
}
