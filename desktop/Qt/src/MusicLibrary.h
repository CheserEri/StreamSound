#pragma once
#include "MusicPlayer.h"
#include "LocalMusicLibrary.h"
#include <QHash>
#include <QSet>
#include <array>
#include <memory>

class MusicDiscover;

struct MusicDirectory {
    std::shared_ptr<MusicDirectory> parent;
    QJsonObject item;
    QJsonArray songs;
    QJsonArray ids;
    QJsonArray albums;
    int cursor = 0;
    int index = 0;
    int anchor = 0;
    int page = 0;
    int parentPhysical = 0;
    int parentLane = 0;
    QJsonObject parentItem;
    int albumCursor = 0;
    bool albumsMore = false;
    bool albumsLoading = false;
};

class MusicLibrary : public QObject {
    Q_OBJECT
  public:
    using Completion = std::function<void(bool)>;
    MusicLibrary(Host *host, const QJsonObject &content, QObject *parent = nullptr);
    ~MusicLibrary() override;
    QJsonObject sessionState() const;
    bool restoreSessionState(const QJsonObject &saved);
    void changed();
    bool isLocal() const {
        return provider == "local";
    }
    void refreshLocal();
    void searchLocal(QString text, QString kind = {});
    void importLocal(const QStringList &paths);
    std::unique_ptr<LocalMusicLibrary> local;
    void observe(int selected);
    void choose(QJsonObject value, bool containerDetails = false,
                std::optional<bool> showDetails = std::nullopt);
    void search(QString text, QString kind = {}, bool more = false);
    void suggest(QString text);
    void showSource(int lane);
    void selectResult(int index, int lane, bool open = true);
    void next(int direction);
    void loadMoreSource(int lane);
    void refreshPersonal(int lane);
    void loadTrackPage(int start);
    void sameAlbum();
    void loadSongWiki();
    void play(bool byUser = true);
    void playDirectory();
    void playOfficial(QJsonObject value = {});
    QJsonArray directoryQueue() const;
    QJsonArray currentSongList() const;
    QString sourceURL(QJsonObject value = {}) const;
    void setGroupView(QString name, QVector<int> indices = {}, int lane = 0);
    QJsonArray sourceItems(int lane) const;
    QJsonArray libraryItems() const;
    QString libraryName() const;
    QVector<int> sourceOrder() const;
    int libraryTotal() const;
    int libraryIndex() const;
    QString providerName() const;
    QString accountKey() const;
    bool editable() const {
        // 自建服务只提供读取与播放，歌单编辑不在支持范围。
        return false;
    }
    bool sourceLoading() const {
        return restoringAccount || searchLoading || personalLoading;
    }
    QString sourceMessage(int lane) const;
    bool restoringAccount = false;
    quint64 accountGeneration() const {
        return m_accountGeneration;
    }
    void switchProvider(QString provider, QString edition = {}, Completion done = {});
    void restoreAccount(Completion done = {});
    void mutate(QString route, QJsonObject values, std::function<void(QJsonObject)> success,
                Completion done = {});
    void like(QJsonObject value = {});
    void subscribe(QJsonObject value = {});
    void playlistForm(QString kind, QString name, QString id = {}, Completion done = {});
    void playlistTrack(QString id, QJsonObject value = {}, bool remove = false, Completion done = {});
    void enterDirectory(QJsonObject value);
    bool openDaily();
    void loadArtistAlbums();
    void openSongArtist(int index = 0);
    void observeDirectory(int physical);
    void selectDirectory(int index, QString mode = "archive", QString axis = "row", int direction = 1);
    void navigateDirectory(int step, QString axis = {});
    void loadDirectoryPage(std::optional<int> selectAfter = std::nullopt);
    void showDirectoryInfo();
    void returnToDirectory();
    void leaveDirectory(bool restore = true);
    void followPlayback(QJsonObject track);
    Host *host;
    MusicApi api;
    MusicPlayer player;
    std::unique_ptr<MusicDiscover> discover;
    std::array<QJsonArray, 5> lists;
    std::array<int, 5> totals{};
    std::array<int, 5> offsets{};
    std::array<bool, 5> hasMore{true, true, true, true, true};
    std::array<int, 5> rowMemory{};
    std::array<QVector<int>, 5> physicalSlots;
    QStringList columns{"搜索结果", "喜欢的歌曲", "我的歌单", "收藏歌单", "收藏专辑"};
    QJsonObject current;
    QJsonArray tracks;
    QJsonArray trackIDs;
    // 记录当前单曲被选中时所在的歌曲列表
    QJsonArray playContext;
    QHash<QString, QJsonObject> details;
    QString searchKind = "song";
    QString keyword;
    QString status = "输入关键词检索音乐";
    QString provider;
    QString uid;
    QString nickname;
    int selectedPhysical = -1;
    int selectedLane = 0;
    bool detailLoading = false;
    QString coverImage;
    QString coverKey;
    bool accountLoading = false;
    bool wantsSongDetails = false;
    std::shared_ptr<MusicDirectory> directory;
    bool directoryLoading = false;
    bool directoryInfo = false;
    bool searchLoading = false;
    bool personalLoading = false;
    bool trackLoad = false;
    bool albumLoaded = false;
    bool writeLoading = false;
    bool privateSelection = false;
    int searchCursor = 0;
    int playlistCursor = 0;
    int albumCursor = 0;
    int likedCursor = 0;
    int trackCursor = 0;
    int folderCursor = 0;
    int historyCursor = 0;
    std::optional<QJsonArray> likedIDs;
    QSet<QString> subscriptions;
    QHash<QString, QString> subscriptionStates;
    void loadSubscriptionStatus(const QJsonObject &value);
    QJsonObject capabilities;
    QString vipLevel = "unknown";
    bool canEditPlaylist(const QJsonObject &value) const;
    bool canMutate(const QString &route) const;
    QStringList searchHistory;
    QStringList suggestions;
    QString groupName;
    QVector<int> groupIndices;
    int groupLane = -1;
    QJsonObject frame;
    quint64 revision = 0;

  signals:
    void invalidated();
    void playbackInvalidated();
    void selectionRequested(int index, QJsonObject navigation);
    void modeRequested(QString mode);
    void navigationRequested(QString axis, int direction);
    void musicIdentityRequested(QString key);
    void musicClearRequested();

  private:
    quint64 m_generation = 0;
    quint64 m_selectionGeneration = 0;
    quint64 m_accountGeneration = 0;
    quint64 m_directoryGeneration = 0;
    quint64 m_wikiGeneration = 0;
    quint64 m_suggestGeneration = 0;
    quint64 m_subscriptionGeneration = 0;
    MusicApi::Valid valid(quint64 token, const quint64 *counter);
    void loadCover(const QJsonObject &value);
    void loadLikedIDs(int lane, quint64 token, QString user);
    void completePersonal(int lane, QString error = {});
    int m_pendingLane = -1;
    bool m_playLiked = false;
    QString m_accountError;
    std::array<QString, 5> m_sourceErrors;
    void restoreCachedAccount();
};
