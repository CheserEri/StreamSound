#include "fg/FgConfig.h"
#include "Host.h"
#include "AppStorage.h"
#include <QBuffer>
#include <QClipboard>
#include <QCryptographicHash>
#include <QDateTime>
#include <QDesktopServices>
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QFutureWatcher>
#include <QGuiApplication>
#include <QImageReader>
#include <QJsonArray>
#include <QJsonDocument>
#include <QNetworkReply>
#include <QNetworkInformation>
#include <QPointer>
#include <QRegularExpression>
#include <QSaveFile>
#include <QStandardPaths>
#include <QStyleHints>
#include <QUrlQuery>
#include <QUuid>
#include <QtConcurrentRun>

static QString hash(QByteArray value) {
    return QCryptographicHash::hash(value, QCryptographicHash::Sha256).toHex();
}
// 首启无偏好时优先读取环境变量 STREAMSOUND_SERVER，否则回退到本机地址。
static QString defaultServerAddress() {
    const auto configured = qEnvironmentVariable("STREAMSOUND_SERVER").trimmed();
    return configured.isEmpty() ? QStringLiteral("http://127.0.0.1:8080") : configured;
}
// 按路由隔离的缓存与限流范围；现在只剩自建服务与本地曲库。
static QString routeProvider(const QString &route) {
    if (route.startsWith("/native/")) {
        return route.section('/', 2, 2);
    }
    if (route.startsWith("/streamsound/")) {
        return "streamsound";
    }
    return "streamsound";
}
Host::Host(QString path, bool test, QObject *parent)
    : QObject(parent), updater(test), root(path), offline(test) {
    connect(&updater, &AppUpdater::changed, this, &Host::invalidate);
    if (offline) {
        interval = 0;
    }
    if (!offline) {
        platformMediaCommands([this](QString action) {
            QMetaObject::invokeMethod(
                this, [this, action] { emit mediaAction(action); }, Qt::QueuedConnection);
        });
    }
    connect(QGuiApplication::styleHints(), &QStyleHints::colorSchemeChanged, this,
            [this] { emit invalidated(); });
    connect(&child, &BridgeProcess::started, this, [this] {
        const auto keys = pending.values();
        pending.clear();
        for (const auto &key : keys) {
            send(key);
        }
    });
    connect(&child, &BridgeProcess::errorOccurred, this, [this](BridgeProcess::ProcessError error) {
        if (error != BridgeProcess::FailedToStart) {
            return;
        }
        const auto keys = pending.values();
        pending.clear();
        for (const auto &key : keys) {
            finish(key, {}, QStringLiteral("音乐服务组件缺失，请重新构建应用"));
        }
    });
    connect(&child, &BridgeProcess::readyReadStandardOutput, this, [this] {
        buffer += child.readAllStandardOutput();
        if (buffer.size() >= 32 * 1024 * 1024) {
            child.kill();
            buffer.clear();
            return;
        }
        qsizetype end;
        while ((end = buffer.indexOf('\n')) >= 0) {
            const auto line = buffer.left(end);
            buffer.remove(0, end + 1);
            const auto response = QJsonDocument::fromJson(line).object();
            const auto id = response["id"].toString();
            if (pending.contains(id)) {
                finish(pending.take(id), response);
            }
        }
    });
    connect(&child, &BridgeProcess::finished, this, [this] {
        const auto keys = pending.values();
        pending.clear();
        buffer.clear();
        for (const auto &key : keys) {
            finish(key, {}, QStringLiteral("音乐服务已退出，请重试"));
        }
    });
}
Host::~Host() {
    shutdown();
}
int Host::lifetime(const QString &route) {
    // StreamSound 自建服务：曲目与搜索可缓存，账号与写操作必须实时。
    if (route.startsWith("/streamsound/") ||
        (route.startsWith("/native/") && route.section('/', 2, 2) == "streamsound")) {
        const auto operation =
            route.startsWith("/native/") ? route.section('/', 3, 3) : route.section('/', 2, 2);
        if (operation == "songs" || operation == "detail" || operation == "wiki") {
            return 86400;
        }
        if (operation == "search") {
            return 300;
        }
        return 0;
    }
    return 0;
}
QString Host::cacheKey(QString scope, QString route, QJsonObject params) {
    params.remove("timestamp");
    return hash((scope + route).toUtf8() + QJsonDocument(params).toJson(QJsonDocument::Compact));
}
QString Host::diskPath(QString key) const {
    return AppStorage::cacheDirectory() + "/metadata/" + key + ".json";
}
/**
 * 接收原生业务请求，在协议外层执行缓存、合并和限流。
 * 记录当前账号代数，异步结果只能交付给仍有效的请求。
 */
void Host::requestJson(QString route, QJsonObject values, JsonReply callback) {
    if (stopped) {
        return;
    }
    if (provider == "local" && route != "/local/lyrics" &&
        !(route.startsWith("/native/") &&
          QStringList{"search", "lyrics", "songs"}.contains(route.section('/', 3, 3)))) {
        callback({}, QStringLiteral("本地模式已禁用在线平台操作"));
        return;
    }
    const auto operation = route.section('/', 3, 3);
    const bool playbackRequest =
        (route.startsWith("/native/") && (operation == "playback" || operation == "preview")) ||
        route == "/song/url" || route == "/song/url/v1";
    if (audioDiagnosticsEnabled && playbackRequest) {
        const int serial = ++diagnosticRequestSerial;
        QElapsedTimer requestClock;
        requestClock.start();
        int operationCode = 3;
        if (route.startsWith("/native/")) {
            operationCode = operation == "preview" ? 2 : 1;
        }
        const int requestProvider = int(std::max<qsizetype>(
            0, QStringList{"other", "streamsound", "local"}.indexOf(routeProvider(route))));
        playbackDiagnostics.record(
            "request-start",
            {{"requestSerial", serial}, {"operation", operationCode}, {"provider", requestProvider}});
        const int diagnosticSession = playbackDiagnostics.session();
        callback = [this, diagnosticSession, callback = std::move(callback), requestClock, serial,
                    operationCode, requestProvider](QJsonObject response, QString error) {
            const auto body = response["body"].toObject();
            QJsonObject values{{"requestSerial", serial},
                               {"operation", operationCode},
                               {"provider", requestProvider},
                               {"requestDurationMs", double(requestClock.elapsed())},
                               {"transportFailed", !error.isEmpty()},
                               {"stale", response["_epoch"].toInt() != epoch},
                               {"replyBytes", QJsonDocument(response).toJson(QJsonDocument::Compact).size()}};
            if (response["_playbackDiagnosticsOmitted"].isDouble()) {
                values["omittedUpstreamEvents"] = response["_playbackDiagnosticsOmitted"];
            }
            for (const auto *key : {"code", "upstreamHttpStatus", "upstreamCode"}) {
                if (body[key].isDouble()) {
                    values[QString(key) == "code" ? "serviceCode" : key] = body[key];
                }
            }
            if (diagnosticSession == playbackDiagnostics.session()) {
                playbackDiagnostics.record("request-finish", values);
            }
            for (const auto &entry : response["_playbackDiagnostics"].toArray()) {
                auto upstream = PlaybackDiagnostics::numericFields(entry.toObject());
                upstream["requestSerial"] = serial;
                if (diagnosticSession == playbackDiagnostics.session()) {
                    playbackDiagnostics.record("upstream", upstream);
                }
            }
            response.remove("_playbackDiagnostics");
            response.remove("_playbackDiagnosticsOmitted");
            callback(response, error);
        };
    }
    // 服务端无鉴权：缓存范围不再随账号变化，所有请求共用同一份缓存空间。
    const bool cached = lifetime(route) > 0;
    const auto key = cached ? cacheKey("streamsound/" + QString::number(metadataRevision), route, values)
                            : QUuid::createUuid().toString();
    const bool disk = false;
    Waiter waiter{std::move(callback), epoch};
    if (disk && !cache.contains(key)) {
        QFile f(diskPath(key));
        if (f.open(QIODevice::ReadOnly)) {
            auto obj = QJsonDocument::fromJson(f.readAll()).object();
            cache.insert(key, {qint64(obj["expiry"].toDouble()), obj["body"].toObject()});
        }
    }
    if (cached && cache.contains(key) && cache[key].expiry > QDateTime::currentMSecsSinceEpoch()) {
        auto body = cache[key].body;
        QTimer::singleShot(0, this, [=, this] { respond(waiter, {{"body", body}}, {}); });
        return;
    }
    if (flights.contains(key)) {
        flights[key].waiters.append(waiter);
        return;
    }
    flights.insert(
        key, {QUuid::createUuid().toString(), route, key, values, cookies, {waiter}, disk, metadataRevision});
    if (cached || route == "/song/url" || route == "/song/url/v1") {
        queue.enqueue(key);
        pump();
    } else {
        send(key);
    }
}

void Host::pump() {
    if (stopped || !active.isEmpty() || queue.isEmpty()) {
        return;
    }
    active = queue.dequeue();
    const auto service = routeProvider(flights[active].route);
    if (blockedUntil[service] > QDateTime::currentMSecsSinceEpoch()) {
        const auto key = active;
        QTimer::singleShot(0, this, [=, this] {
            finish(key, {}, QStringLiteral("音乐服务提示访问频繁，已暂停该平台的新请求；缓存仍可浏览"));
        });
        return;
    }
    auto key = active;
    int wait = int(qMax<qint64>(0, interval - (QDateTime::currentMSecsSinceEpoch() - lastStart)));
    QTimer::singleShot(wait, this, [=, this] {
        if (!stopped) {
            lastStart = QDateTime::currentMSecsSinceEpoch();
            send(key);
        }
    });
}
void Host::send(QString key) {
    if (!flights.contains(key) || stopped) {
        return;
    }
    auto work = flights[key];
    if (offline) {
        QTimer::singleShot(0, this, [=, this] {
            if (fixture) {
                finish(key, fixture(work.route, work.params));
            } else {
                finish(key, {}, "Offline: no local fixture for " + work.route);
            }
        });
        return;
    }
    if (child.state() == BridgeProcess::NotRunning) {
        temporary = std::make_unique<QTemporaryDir>(AppStorage::temporaryDirectory() + "/rhine-music-XXXXXX");
        if (!temporary->isValid()) {
            finish(key, {}, "无法创建音乐服务临时目录");
            return;
        }
#ifdef Q_OS_IOS
        pending.insert(work.id, key);
        child.start(root, temporary->path(), serverAddress());
        return;
#else
        QProcessEnvironment env;
#ifdef Q_OS_WIN
        const auto system = QProcessEnvironment::systemEnvironment();
        for (const auto &name : {"SystemRoot", "WINDIR"}) {
            if (system.contains(name)) {
                env.insert(name, system.value(name));
            }
        }
        env.insert("PATH", system.value("SystemRoot") + "/System32");
        // 上游运行时的用户目录和临时目录也限定在绿色版目录，不继承旧版缓存位置。
        env.insert("USERPROFILE", AppStorage::dataDirectory());
        env.insert("APPDATA", AppStorage::dataDirectory());
        env.insert("LOCALAPPDATA", AppStorage::dataDirectory());
        env.insert("TEMP", temporary->path());
        env.insert("TMP", temporary->path());
#else
        env.insert("PATH", "/usr/bin:/bin");
#endif
        env.insert("TMPDIR", temporary->path());
        env.insert("LANG", "en_US.UTF-8");
        // 子进程的工作目录改到应用自己的系统临时目录
        child.setWorkingDirectory(temporary->path());
        child.setStandardErrorFile(BridgeProcess::nullDevice());
        // 平台选择放在宏调用外，避免 MSVC 将条件编译指令当作宏参数。
#ifdef Q_OS_WIN
        const auto nodeName = QStringLiteral("node.exe");
#else
        const auto nodeName = QStringLiteral("node");
#endif
        // 开发环境未随包放置 node.exe 时回退到系统 node，并把其目录加入受限 PATH。
        auto nodeProgram = root + "/MusicBridge/" + nodeName;
        if (!QFileInfo::exists(nodeProgram)) {
            const auto systemNode = QStandardPaths::findExecutable(QStringLiteral("node"));
            if (!systemNode.isEmpty()) {
                nodeProgram = systemNode;
                env.insert("PATH", env.value("PATH") + ";" + QFileInfo(systemNode).absolutePath());
            }
        }
        env.insert("STREAMSOUND_SERVER", serverAddress());
        // 环境变量必须在全部 insert 完成后一次性下发，否则后续写入不会进入子进程。
        child.setProcessEnvironment(env);
        pending.insert(work.id, key);
        child.start(nodeProgram, {root + "/MusicBridge/worker.cjs"});
#endif
        return;
    }
    if (child.state() == BridgeProcess::Starting) {
        pending.insert(work.id, key);
        return;
    }
    pending.insert(work.id, key);
    QJsonObject envelope{
        {"id", work.id}, {"route", work.route}, {"params", work.params}, {"cookies", work.cookies}};
    if (audioDiagnosticsEnabled && work.route.startsWith("/native/") &&
        QStringList{"playback", "preview"}.contains(work.route.section('/', 3, 3))) {
        envelope["_collectPlaybackDiagnostics"] = true;
    }
    child.write(QJsonDocument(envelope).toJson(QJsonDocument::Compact) + '\n');
    QTimer::singleShot(30000, this, [=, this] {
        if (pending.remove(work.id)) {
            finish(key, {}, "音乐请求超时，请重试");
        }
    });
}
void Host::finish(QString key, QJsonObject response, QString error) {
    if (!flights.contains(key)) {
        return;
    }
    const auto work = flights.take(key);
    const auto body = response["body"].toObject();
    const auto code = body["code"].toInt(200);
    if (lifetime(work.route) || work.route == "/song/url" || work.route == "/song/url/v1") {
        const auto message = body["message"].toString(body["msg"].toString());
        if (QList<int>{405, 429, 509}.contains(code) || message.contains("频繁")) {
            blockedUntil[routeProvider(work.route)] =
                QDateTime::currentMSecsSinceEpoch() + qMax(120000LL, qint64(body["retryAfterMs"].toDouble()));
        }
        if (work.cacheRevision == metadataRevision && lifetime(work.route) && error.isEmpty() &&
            response["body"].isObject() && code == 200) {
            Entry entry{QDateTime::currentMSecsSinceEpoch() + lifetime(work.route) * 1000LL, body};
            cache.insert(key, entry);
            if (cache.size() > 256) {
                for (auto it = cache.begin(); it != cache.end();) {
                    if (it->expiry <= QDateTime::currentMSecsSinceEpoch()) {
                        it = cache.erase(it);
                    } else {
                        ++it;
                    }
                }
                if (cache.size() > 256) {
                    cache.erase(cache.begin());
                }
            }
            if (work.disk) {
                auto path = diskPath(key);
                QDir().mkpath(QFileInfo(path).path());
                QFile::setPermissions(QFileInfo(path).path(),
                                      QFile::ReadOwner | QFile::WriteOwner | QFile::ExeOwner);
                QSaveFile f(path);
                if (f.open(QIODevice::WriteOnly)) {
                    f.setPermissions(QFile::ReadOwner | QFile::WriteOwner);
                    f.write(QJsonDocument(QJsonObject{{"expiry", double(entry.expiry)}, {"body", body}})
                                .toJson(QJsonDocument::Compact));
                    f.commit();
                }
            }
        }
    }
    for (auto waiter : work.waiters) {
        respond(waiter, response, error);
    }
    if (active == key) {
        active.clear();
        pump();
    }
}
void Host::respond(const Waiter &waiter, QJsonObject response, QString error) {
    if (stopped) {
        return;
    }
    response["_epoch"] = waiter.epoch;
    waiter.callback(response, error);
}
void Host::schedule(int ms, std::function<void()> callback) {
    QTimer::singleShot(qMax(0, ms), this, [this, callback = std::move(callback)] {
        if (!stopped) {
            callback();
        }
    });
}
/** 首启或偏好为空时回退到环境变量或本机地址。 */
QString Host::serverAddress() const {
    const auto saved = preference("streamsound-server");
    return saved.isEmpty() ? defaultServerAddress() : saved;
}
/**
 * 切换音乐来源：只剩自建服务与本地曲库两种。
 * 来源变化会作废旧请求并清空缓存，避免跨来源串数据。
 */
void Host::setProvider(QString value) {
    if (value != "local" && value != "streamsound") {
        return;
    }
    if (provider == value) {
        return;
    }
    provider = value;
    ++epoch;
    ++metadataRevision;
    cache.clear();
    images.clear();
    coverFlights.clear();
    proxyBase.clear();
}
/** 保存新的服务器地址并重启桥接子进程，让新地址立即生效。 */
void Host::setServerAddress(QString address) {
    address = address.trimmed();
    if (address.isEmpty() || address.size() > 2048) {
        return;
    }
    setPreference("streamsound-server", address);
    restartBridge();
}
/** 作废在途请求并重启桥接子进程；设备身份与偏好不变。 */
void Host::restartBridge() {
    if (offline || stopped) {
        return;
    }
    ++epoch;
    ++metadataRevision;
    cache.clear();
    images.clear();
    coverFlights.clear();
    proxyBase.clear();
    if (child.state() != BridgeProcess::NotRunning) {
        child.kill();
        child.waitForFinished(1000);
    }
}
void Host::loadCover(QString input, TextReply callback) {
    const QUrl local(input);
    if (local.isLocalFile()) {
        if (provider != "local" && !offline) {
            return;
        }
        const auto key = input;
        if (images.contains(key)) {
            callback(key);
            return;
        }
        const auto generation = epoch;
        auto watcher = new QFutureWatcher<QImage>(this);
        connect(watcher, &QFutureWatcher<QImage>::finished, this, [this, watcher, generation, key, callback] {
            const auto image = watcher->result();
            watcher->deleteLater();
            if (generation == epoch && !stopped) {
                if (!image.isNull()) {
                    images.insert(key, new QImage(image), qMax(1, int(image.sizeInBytes() / 1024)));
                }
                callback(image.isNull() ? QString() : key);
            }
        });
        watcher->setFuture(QtConcurrent::run([path = local.toLocalFile()] {
            QImageReader reader(path);
            const auto size = reader.size();
            if (!size.isValid() || size.width() > 8192 || size.height() > 8192) {
                return QImage();
            }
            if (size.width() > 1024 || size.height() > 1024) {
                reader.setScaledSize(size.scaled(1024, 1024, Qt::KeepAspectRatio));
            }
            return reader.read();
        }));
        return;
    }
    // 会话保存的封面地址带着上次运行时的代理端口与密钥，端口每次启动都会变；
    // 按桥接当前代理地址重建，否则旧会话里的封面全部指向已失效的本地地址。
    if (!offline && !stopped && provider == "streamsound" && input.startsWith("http://127.0.0.1:")) {
        const auto covers = input.indexOf(QStringLiteral("/covers/"));
        if (covers < 0) {
            callback({});
            return;
        }
        const auto suffix = input.mid(covers);
        if (proxyBase.isEmpty()) {
            const auto generation = epoch;
            requestJson(
                "/native/" + provider + "/proxy", {},
                [this, suffix, callback, generation](QJsonObject response, QString error) {
                    const auto base = error.isEmpty()
                                          ? response["body"].toObject()["value"].toString()
                                          : QString();
                    if (base.isEmpty() || generation != epoch || stopped) {
                        callback({});
                        return;
                    }
                    proxyBase = base;
                    loadCover(base + suffix, callback);
                });
            return;
        }
        input = proxyBase + suffix;
    }
    // 桥接内置的本地媒体代理只监听回环地址，必须保留 http 协议。
    const bool loopback = input.startsWith("http://127.0.0.1") || input.startsWith("http://localhost");
    QUrl url(loopback ? input : input.replace("http://", "https://"));
    const auto domain = url.host();
    if (!loopback &&
        !(domain == "music.126.net" || domain.endsWith(".music.126.net") || domain == "music.163.com" ||
          domain.endsWith(".music.163.com") || domain == "y.gtimg.cn" || domain == "qpic.y.qq.com" ||
          domain == "y.qq.com" || domain.endsWith(".kugou.com") || domain.endsWith(".kgimg.com"))) {
        callback({});
        return;
    }
    if (!loopback) {
        QUrlQuery query(url);
        query.removeAllQueryItems("param");
        query.addQueryItem("param", "1024y1024");
        url.setQuery(query);
    }
    auto key = url.toString();
    if (images.contains(key)) {
        callback(key);
        return;
    }
    if (offline) {
        callback({});
        return;
    }
    if (coverFlights.contains(key)) {
        coverFlights[key].append({callback, epoch});
        return;
    }
    coverFlights[key] = {{callback, epoch}};
    const auto imageEpoch = epoch;
    QNetworkRequest request(url);
    request.setTransferTimeout(20000);
    request.setAttribute(QNetworkRequest::RedirectPolicyAttribute, QNetworkRequest::NoLessSafeRedirectPolicy);
    auto reply = network.get(request);
    connect(reply, &QNetworkReply::downloadProgress, reply, [reply](qint64 size, qint64) {
        if (size >= 8 * 1024 * 1024) {
            reply->abort();
        }
    });
    connect(reply, &QNetworkReply::finished, this, [=, this]() {
        const auto bytes = reply->readAll();
        if (imageEpoch != epoch || stopped) {
            reply->deleteLater();
            return;
        }
        const bool valid = reply->error() == QNetworkReply::NoError &&
                           reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt() == 200 &&
                           bytes.size() < 8 * 1024 * 1024;
        reply->deleteLater();
        if (!valid) {
            const auto waiters = coverFlights.take(key);
            for (const auto &waiter : waiters) {
                if (waiter.epoch == epoch) {
                    waiter.callback({});
                }
            }
            return;
        }
        // 工作者只接触不可变字节和 QImage；回调与缓存仍在 Host 所在线程执行。
        auto watcher = new QFutureWatcher<QImage>(this);
        connect(watcher, &QFutureWatcher<QImage>::finished, this, [this, watcher, key, imageEpoch] {
            const auto image = watcher->result();
            watcher->deleteLater();
            if (imageEpoch != epoch || stopped) {
                return;
            }
            const auto waiters = coverFlights.take(key);
            bool current = false;
            for (const auto &waiter : waiters) {
                current |= waiter.epoch == epoch;
            }
            if (stopped || !current) {
                return;
            }
            if (image.isNull()) {
                for (const auto &waiter : waiters) {
                    if (waiter.epoch == epoch) {
                        waiter.callback({});
                    }
                }
                return;
            }
            // QCache 按内存预算逐项淘汰，不再在第 32 张封面清空所有命中。
            images.insert(key, new QImage(image), qMax(1, int(image.sizeInBytes() / 1024)));
            for (const auto &waiter : waiters) {
                if (waiter.epoch == epoch) {
                    waiter.callback(key);
                }
            }
        });
        watcher->setFuture(QtConcurrent::run([bytes] {
            QBuffer buffer;
            buffer.setData(bytes);
            buffer.open(QIODevice::ReadOnly);
            QImageReader reader(&buffer);
            const auto size = reader.size();
            if (!size.isValid() || size.width() > 8192 || size.height() > 8192) {
                return QImage();
            }
            // 保留大封面的细节；小图不在解码阶段放大，避免重复插值。
            if (size.width() > 1024 || size.height() > 1024) {
                reader.setScaledSize(size.scaled(1024, 1024, Qt::KeepAspectRatio));
            }
            return reader.read();
        }));
    });
}
QImage Host::image(const QString &key) const {
    // 官方音质标识随包离线交付；限定文件名，防止图片键访问资源目录之外。
    static const QRegularExpression qualityKey(
        "^quality:(netease|qq|kugou)-(sq|hq|hires|jymaster|jyeffect|sky)$");
    if (key.startsWith("quality:") && qualityKey.match(key).hasMatch()) {
        static QCache<QString, QImage> badges(32);
        if (auto cached = badges.object(key)) {
            return *cached;
        }
        const QImage badge(root + "/quality/" + key.mid(8) + ".png");
        badges.insert(key, new QImage(badge));
        return badge;
    }
    auto p = images.object(key);
    return p ? *p : QImage();
}
void Host::trimMemory(const QStringList &retainedImages) {
    QHash<QString, QImage> retained;
    for (const auto &key : retainedImages) {
        const auto pixels = image(key);
        if (!pixels.isNull()) {
            retained.insert(key, pixels);
        }
    }
    // 请求结果仍可从磁盘按需读取；保留当前 HUD 图片，避免恢复后二维码或封面空白。
    cache.clear();
    images.clear();
    int retainedCost = 0;
    for (const auto &pixels : retained) {
        retainedCost += qMax(1, int(pixels.sizeInBytes() / 1024));
    }
    // 渲染预算
    images.setMaxCost(qMax(4 * 1024, retainedCost));
    for (auto it = retained.begin(); it != retained.end(); ++it) {
        images.insert(it.key(), new QImage(it.value()), qMax(1, int(it->sizeInBytes() / 1024)));
    }
}
void Host::fixtureImage(const QString &key, const QImage &image) {
    // 仅离线窗口验收可注入本地封面，不读取账号或访问封面服务器。
    if (offline && !image.isNull()) {
        images.insert(key, new QImage(image), int(image.sizeInBytes() / 1024));
    }
}
void Host::playOfficial(QString id, TextReply callback) {
    if (!PlatformFeatures::OfficialPlayback) {
        callback(QStringLiteral("当前平台仅支持面板内播放"));
        return;
    }
    if (!QRegularExpression("^[0-9]{1,20}$").match(id).hasMatch()) {
        callback("请先选择一首歌曲");
        return;
    }
    if (offline) {
        callback("OFFLINE_PLAY:" + id);
        return;
    }
    QPointer<Host> guarded(this);
    platformPlay(id, activates(), [guarded, callback](QString message) mutable {
        if (guarded && !guarded->stopped) {
            callback(message);
        }
    });
}
bool Host::mediaLoad(QString url, bool alternative, double position, bool paused) {
    if (!audio) {
        audio = std::make_unique<AudioPlayer>([this] { emit mediaChanged(); });
        audio->diagnosticEvent = [this](const QString &event, const QJsonObject &values) {
            playbackDiagnostics.record(event, values);
        };
        audio->enableDiagnostics(audioDiagnosticsEnabled);
    }
    return audio->load(url, offline, alternative, provider, position, paused);
}
void Host::mediaControl(QString action, double value) {
    if (action == "volume" && !PlatformFeatures::ApplicationVolume) {
        value = 1.0;
    }
    if (!audio && action == "volume") {
        audio = std::make_unique<AudioPlayer>([this] { emit mediaChanged(); });
        audio->diagnosticEvent = [this](const QString &event, const QJsonObject &values) {
            playbackDiagnostics.record(event, values);
        };
        audio->enableDiagnostics(audioDiagnosticsEnabled);
    }
    if (audio) {
        audio->control(action, value);
    }
    emit mediaChanged();
}
void Host::mediaMetadata(QString title, QString artist, QString album) {
    mediaTitle = title.left(256);
    mediaArtist = artist.left(256);
    mediaAlbum = album.left(256);
    lastMediaUpdate = 0;
}
QVariantMap Host::mediaState() const {
    auto state = audio ? audio->state() : QVariantMap();
    auto now = QDateTime::currentMSecsSinceEpoch();
    if (!offline && now - lastMediaUpdate >= 1000) {
        lastMediaUpdate = now;
        platformMediaInfo(mediaTitle, mediaArtist, mediaAlbum, state);
    }
    return state;
}
void Host::copy(QString text) {
    QGuiApplication::clipboard()->setText(text);
}
void Host::open(QString url) {
    if (!offline && QUrl(url).scheme() == "https") {
        QDesktopServices::openUrl(QUrl(url));
    }
}
bool Host::systemDark() const {
    return QGuiApplication::styleHints()->colorScheme() == Qt::ColorScheme::Dark;
}
void Host::invalidateMetadata() {
    ++metadataRevision;
    cache.clear();
    if (offline) {
        return;
    }
    QDir metadata(AppStorage::cacheDirectory() + "/metadata");
    for (const auto &name : metadata.entryList({"*.json"}, QDir::Files)) {
        metadata.remove(name);
    }
}
namespace {
// 可读写的偏好键。读取与写入必须共用同一份名单：两份名单一旦分叉，写入会成功但读回
// 为空，界面上的表现就是"设置完立刻跳回原值"。
const QStringList &preferenceKeys() {
    static const QStringList keys{
        "search-history", "play-history", "local-cover-cache", "theme", "motion", "startup-animation",
        "detail-autoplay", "single-play-mode", "disc-rotation", "scene-enhancement", "archive-mask-strength",
        "graphics-backend",
        // Linux 显卡选择：存的是 /sys/class/drm 里 cardN 的序号（0 基），不是型号。
        // 换卡后序号可能指向另一张卡或不存在，启动时由 initializeLinuxGraphics 校验并回退。
        "gpu-index", "vsync", "supersample", "render-scale", "aa-mode", "aa-scale", "msaa", "fsr-quality",
        "fsr-sharpness", "fg", "auto-update", "volume", "quality", "alternate-source", "provider",
        "lyrics-cache", "lyrics-global-offset-ms", "streamsound-server"};
    return keys;
}
} // namespace
QString Host::preference(QString key) const {
    if (offline || !preferenceKeys().contains(key)) {
        return {};
    }
    return AppStorage::settings().value("panel/" + key).toString();
}
void Host::setPreference(QString key, QString value) {
    if (!offline && value.size() < 262144 && preferenceKeys().contains(key)) {
        AppStorage::settings().setValue("panel/" + key, value);
        // 帧生成开关是唯一"不必重启也能生效"的偏好：呈现层每帧解析 RHINE_FG，
        // 所以这里写完磁盘再同步一次环境变量，设置页点一下就切换插值。
        // 具体转换在 RhineFg::applyInterpolationPreference（有单测）。
        if (key == QLatin1String("fg")) {
            RhineFg::applyInterpolationPreference(value);
        }
#ifdef Q_OS_MACOS
        emit preferenceChanged(key, value);
#endif
    }
}
bool Host::activates() const {
    return offline ? false : platformActivates();
}
void Host::setActivates(bool value) {
    if (!offline) {
        platformSetActivates(value);
    }
}
QString Host::asset(QString name) const {
    return QUrl::fromLocalFile(root + "/" + name).toString();
}
QString Host::read(QString name) const {
    QFile f(root + "/" + name);
    if (!f.open(QIODevice::ReadOnly)) {
        return {};
    }
    return QString::fromUtf8(f.readAll());
}
/**
 * 停止桥接子进程并释放等待请求，避免退出后仍有回调。
 */
void Host::shutdown() {
    if (stopped) {
        return;
    }
    stopped = true;
    coverFlights.clear();
    if (!offline) {
        platformMediaCommands({});
        platformMediaInfo({}, {}, {}, {});
    }
    audio.reset();
    disconnect(&child, nullptr, this, nullptr);
    child.closeWriteChannel();
    if (child.state() != BridgeProcess::NotRunning) {
        child.terminate();
        if (!child.waitForFinished(2000)) {
            child.kill();
            child.waitForFinished(2000);
        }
    }
    flights.clear();
    pending.clear();
    queue.clear();
    temporary.reset();
}

/** 性能面板按需开启解码统计，网络只读取系统公开的枚举状态，不枚举地址或网络名称。 */
void Host::enablePlaybackDiagnostics(bool enabled) {
    audioDiagnosticsEnabled = enabled;
    if (enabled && !QNetworkInformation::instance()) {
        QNetworkInformation::loadDefaultBackend();
    }
    if (audio) {
        audio->enableDiagnostics(enabled);
    }
}

QJsonObject Host::playbackSnapshot() const {
    auto values = audio ? audio->diagnosticState() : QJsonObject();
    values["bridgeState"] = int(child.state());
    values["bridgeError"] = int(child.error());
    const auto *information = QNetworkInformation::instance();
    if (information) {
        if (information->supports(QNetworkInformation::Feature::Reachability)) {
            values["networkReachability"] = int(information->reachability());
        }
        if (information->supports(QNetworkInformation::Feature::TransportMedium)) {
            values["networkTransport"] = int(information->transportMedium());
        }
        if (information->supports(QNetworkInformation::Feature::Metered)) {
            values["networkMetered"] = information->isMetered();
        }
        if (information->supports(QNetworkInformation::Feature::CaptivePortal)) {
            values["networkCaptive"] = information->isBehindCaptivePortal();
        }
    }
    return PlaybackDiagnostics::numericFields(values);
}
