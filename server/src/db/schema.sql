-- Users table
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'user',
    approved    INTEGER NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL
);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    path        TEXT    NOT NULL UNIQUE,
    parent_id   INTEGER REFERENCES folders(id),
    track_count INTEGER NOT NULL DEFAULT 0
);

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    path        TEXT    NOT NULL UNIQUE,
    folder_id   INTEGER NOT NULL REFERENCES folders(id),
    title       TEXT    NOT NULL,
    artist      TEXT,
    album       TEXT,
    duration    INTEGER,
    bitrate     INTEGER,
    sample_rate INTEGER,
    cover_path  TEXT,
    has_lyrics  INTEGER NOT NULL DEFAULT 0,
    lyrics      TEXT,
    file_size   INTEGER,
    mime_type   TEXT,
    scanned_at  INTEGER NOT NULL
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    user_id     INTEGER NOT NULL REFERENCES users(id),
    track_id    INTEGER NOT NULL REFERENCES tracks(id),
    created_at  INTEGER NOT NULL,
    PRIMARY KEY (user_id, track_id)
);

-- Play history table
CREATE TABLE IF NOT EXISTS play_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    track_id    INTEGER NOT NULL REFERENCES tracks(id),
    played_at   INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracks_folder    ON tracks(folder_id);
CREATE INDEX IF NOT EXISTS idx_tracks_title     ON tracks(title);
CREATE INDEX IF NOT EXISTS idx_tracks_artist    ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_history_user     ON play_history(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user   ON favorites(user_id, created_at DESC);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS tracks_fts USING fts5(
    title,
    artist,
    album,
    content='tracks',
    content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS tracks_ai AFTER INSERT ON tracks BEGIN
    INSERT INTO tracks_fts(rowid, title, artist, album)
        VALUES (new.id, new.title, new.artist, new.album);
END;

CREATE TRIGGER IF NOT EXISTS tracks_ad AFTER DELETE ON tracks BEGIN
    INSERT INTO tracks_fts(tracks_fts, rowid, title, artist, album)
        VALUES ('delete', old.id, old.title, old.artist, old.album);
END;

CREATE TRIGGER IF NOT EXISTS tracks_au AFTER UPDATE ON tracks BEGIN
    INSERT INTO tracks_fts(tracks_fts, rowid, title, artist, album)
        VALUES ('delete', old.id, old.title, old.artist, old.album);
    INSERT INTO tracks_fts(rowid, title, artist, album)
        VALUES (new.id, new.title, new.artist, new.album);
END;
