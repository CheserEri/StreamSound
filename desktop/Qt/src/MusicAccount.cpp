#include "MusicLibrary.h"
#include "MusicDiscover.h"
#include "PlatformFeatures.h"
#include <algorithm>

/** 无鉴权：服务器地址非空即视为可用，用地址作为个人库的稳定标识。 */
void MusicLibrary::restoreCachedAccount() {
    uid.clear();
    nickname.clear();
    if (isLocal()) {
        nickname = QStringLiteral("本地音乐");
        return;
    }
    const auto server = host->serverAddress();
    if (server.isEmpty()) {
        return;
    }
    uid = server;
    nickname = server;
}

void MusicLibrary::restoreAccount(Completion done) {
    if (isLocal()) {
        if (done) {
            done(true);
        }
        return;
    }
    restoreCachedAccount();
    restoringAccount = false;
    m_accountError.clear();
    const auto pending = m_pendingLane;
    m_pendingLane = -1;
    if (!uid.isEmpty() && pending > 0) {
        loadMoreSource(pending);
    }
    changed();
    if (done) {
        done(!uid.isEmpty());
    }
}

/** 切换来源：只剩自建服务与本地曲库，切换后作废在途请求并重置状态。 */
void MusicLibrary::switchProvider(QString source, QString edition, Completion done) {
    Q_UNUSED(edition);
    if (source != "local" && source != "streamsound") {
        if (done) {
            done(false);
        }
        return;
    }
    if (source == "local" && !PlatformFeatures::LocalMusic) {
        if (done) {
            done(false);
        }
        return;
    }
    if (source == provider) {
        if (done) {
            done(true);
        }
        return;
    }
    // 先隔离旧请求并停止播放，再恢复目标来源的独立状态。
    ++m_generation;
    ++m_accountGeneration;
    ++m_selectionGeneration;
    ++m_directoryGeneration;
    ++m_wikiGeneration;
    ++m_suggestGeneration;
    discover->cancel();
    player.stop();
    local->cancel();
    emit musicClearRequested();
    provider = source;
    host->setProvider(source);
    host->setPreference("provider", source);
    api.provider = source;
    restoreCachedAccount();
    restoringAccount = false;
    m_pendingLane = -1;
    m_playLiked = false;
    m_accountError.clear();
    m_sourceErrors.fill({});
    current = {};
    directory.reset();
    groupLane = -1;
    groupName.clear();
    groupIndices.clear();
    details.clear();
    tracks = {};
    trackIDs = {};
    coverImage.clear();
    coverKey.clear();
    for (auto &list : lists) {
        list = {};
    }
    totals.fill(0);
    offsets.fill(0);
    hasMore.fill(true);
    rowMemory.fill(0);
    likedIDs.reset();
    likedCursor = 0;
    albumCursor = 0;
    playlistCursor = 0;
    folderCursor = 0;
    historyCursor = 0;
    searchCursor = 0;
    searchLoading = false;
    personalLoading = false;
    detailLoading = false;
    directoryLoading = false;
    trackLoad = false;
    writeLoading = false;
    subscriptions.clear();
    subscriptionStates.clear();
    capabilities = {};
    vipLevel = "unknown";
    searchKind = "song";
    keyword.clear();
    suggestions.clear();
    selectedPhysical = -1;
    selectedLane = 0;
    privateSelection = false;
    if (isLocal()) {
        refreshLocal();
    } else {
        columns = {"搜索曲目", "喜欢的歌曲", "文件夹", "播放历史", "不可用"};
    }
    status = QStringLiteral("已切换至") + providerName();
    changed();
    restoreAccount(done);
}