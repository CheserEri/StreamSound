#include "Host.h"
#include <QCoreApplication>
#include <QElapsedTimer>
#include <QThread>

#ifdef Q_OS_IOS
bool runIOSBridgeChecks(const QString &root);
#endif

namespace {
bool waitFor(const std::function<bool()> &ready) {
    QElapsedTimer elapsed;
    elapsed.start();
    while (!ready() && elapsed.elapsed() < 2000) {
        QCoreApplication::processEvents();
        QThread::msleep(1);
    }
    return ready();
}
}

/** 不创建脚本引擎，验证原生业务可直接使用缓存、账号代数、封面和官方播放边界。 */
bool runNativeHostChecks(const QString &root) {
    Host host(root, true);
    int requests = 0;
    host.fixture = [&](QString, QJsonObject parameters) {
        ++requests;
        return QJsonObject{{"body", QJsonObject{{"code", 200}, {"query", parameters["keywords"]}}}};
    };
    int replies = 0;
    bool ok = true;
    /* 逐项记录失败原因：分组只输出一个结论时无法定位问题。 */
    const auto step = [](const char *name, bool condition) {
        if (!condition) {
            qCritical() << "host check failed:" << name;
        }
        return condition;
    };
#ifdef Q_OS_IOS
    ok &= runIOSBridgeChecks(root);
#endif
    const auto receive = [&](QJsonObject response, QString error) {
        ++replies;
        ok &= step("merged search reply",
                   error.isEmpty() && response["body"].toObject()["query"] == "native" &&
                       response["_epoch"].toInt() == host.epoch);
    };
    host.requestJson("/native/streamsound/search", {{"keywords", "native"}}, receive);
    host.requestJson("/native/streamsound/search", {{"keywords", "native"}}, receive);
    ok &= step("request merging", waitFor([&] { return replies == 2; }) && requests == 1);
    host.requestJson("/native/streamsound/search", {{"keywords", "native"}}, receive);
    ok &= step("merged cache hit", waitFor([&] { return replies == 3; }) && requests == 1);

    // 来源切换会递增代数并作废在途响应；这里用它验证迟到响应不会修改状态。
    const auto originalEpoch = host.epoch;
    bool staleReceived = false;
    host.requestJson("/native/streamsound/server", {}, [&](QJsonObject response, QString error) {
        staleReceived = error.isEmpty() && response["_epoch"].toInt() == originalEpoch &&
                        response["_epoch"].toInt() != host.epoch;
    });
    host.setProvider("local");
    host.setProvider("streamsound");
    ok &= step("stale response invalidated by provider switch", waitFor([&] { return staleReceived; }));

    QImage image(2, 2, QImage::Format_RGBA8888);
    image.fill(Qt::red);
    const QString cover = "https://music.126.net/native-fixture.jpg?param=1024y1024";
    host.fixtureImage(cover, image);
    bool coverReady = false;
    host.loadCover("https://music.126.net/native-fixture.jpg?param=128y128",
                   [&](QString key) { coverReady = key == cover && host.image(key) == image; });
    ok &= step("cover key canonicalization", coverReady);
    QImage largeCover(1024, 1024, QImage::Format_RGBA8888);
    largeCover.fill(Qt::blue);
    host.fixtureImage("current-cover", largeCover);
    host.fixtureImage("playing-cover", largeCover);
    host.trimMemory({"current-cover", "playing-cover"});
    ok &= step("memory trim keeps playing covers",
               host.image("current-cover") == largeCover && host.image("playing-cover") == largeCover);
    bool invalidId = false;
    bool official = false;
#ifdef Q_OS_IOS
    host.playOfficial("invalid", [&](QString error) { invalidId = error == "当前平台仅支持面板内播放"; });
    host.playOfficial("42", [&](QString value) { official = value == "当前平台仅支持面板内播放"; });
    host.mediaControl("volume", 0.2);
    ok &= step("ios panel volume lock", host.mediaState()["volume"].toDouble() == 1.0);
#else
    host.playOfficial("invalid", [&](QString error) { invalidId = error == "请先选择一首歌曲"; });
    host.playOfficial("42", [&](QString value) { official = value == "OFFLINE_PLAY:42"; });
#endif
    ok &= step("official playback boundary", invalidId && official);

    bool delayed = false;
    host.schedule(0, [&] { delayed = true; });
    ok &= step("scheduled callback", !delayed && waitFor([&] { return delayed; }));
    bool afterShutdown = false;
    host.schedule(0, [&] { afterShutdown = true; });
    host.shutdown();
    QCoreApplication::processEvents();
    ok &= step("shutdown cancels pending callbacks", !afterShutdown);
    qInfo() << "Native Host callbacks, request merging, cache, epoch, images and shutdown:"
            << (ok ? "passed" : "FAILED");
    return ok;
}
