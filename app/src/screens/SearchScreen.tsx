import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSearch } from '../hooks/useSearch';
import { usePlayer } from '../hooks/usePlayer';
import CoverImage from '../components/CoverImage';
import type { TrackListItem, SearchTrack, SearchArtist, SearchAlbum } from '../types';

interface Section {
  title: string;
  data: Array<{ type: 'track' | 'artist' | 'album'; item: any }>;
}

export default function SearchScreen() {
  const { query, result, isLoading, error, search } = useSearch();
  const { playTracks } = usePlayer();

  const sections = useMemo<Section[]>(() => {
    if (!result) return [];

    const secs: Section[] = [];

    if (result.tracks.length > 0) {
      secs.push({
        title: '歌曲',
        data: result.tracks.map((t) => ({ type: 'track' as const, item: t })),
      });
    }

    if (result.artists.length > 0) {
      secs.push({
        title: '艺术家',
        data: result.artists.map((a) => ({ type: 'artist' as const, item: a })),
      });
    }

    if (result.albums.length > 0) {
      secs.push({
        title: '专辑',
        data: result.albums.map((a) => ({ type: 'album' as const, item: a })),
      });
    }

    return secs;
  }, [result]);

  const handleTrackPress = useCallback(
    (track: SearchTrack) => {
      const tracks: TrackListItem[] = result?.tracks.map((t) => ({
        ...t,
        hasLyrics: false,
        folderId: 0,
      })) || [];
      const index = tracks.findIndex((t) => t.id === track.id);
      playTracks(tracks, index >= 0 ? index : 0);
    },
    [result, playTracks],
  );

  const handleArtistPress = useCallback(
    (artist: SearchArtist) => {
      // Play all tracks by this artist from search results
      const artistTracks = result?.tracks.filter(
        (t) => t.artist === artist.name,
      ) || [];
      if (artistTracks.length > 0) {
        const tracks: TrackListItem[] = artistTracks.map((t) => ({
          ...t,
          hasLyrics: false,
          folderId: 0,
        }));
        playTracks(tracks, 0);
      }
    },
    [result, playTracks],
  );

  const handleAlbumPress = useCallback(
    (album: SearchAlbum) => {
      // Play all tracks from this album in search results
      const albumTracks = result?.tracks.filter(
        (t) => t.album === album.name,
      ) || [];
      if (albumTracks.length > 0) {
        const tracks: TrackListItem[] = albumTracks.map((t) => ({
          ...t,
          hasLyrics: false,
          folderId: 0,
        }));
        playTracks(tracks, 0);
      }
    },
    [result, playTracks],
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderHighlight = (text: string | undefined, fallback: string) => {
    if (!text) return fallback;
    // Simple render: remove <em> tags and show plain text
    // In a real app, you'd use react-native-html rendering
    return text.replace(/<\/?em>/g, '');
  };

  const renderItem = ({ item }: { item: { type: string; item: any } }) => {
    if (item.type === 'track') {
      const track = item.item as SearchTrack;
      return (
        <TouchableOpacity
          style={styles.trackItem}
          onPress={() => handleTrackPress(track)}
        >
          <CoverImage trackId={track.id} hasCover={track.hasCover} size={48} />
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {renderHighlight(track.highlight?.title, track.title)}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {renderHighlight(track.highlight?.artist, track.artist || '未知艺术家')}
            </Text>
          </View>
          <Text style={styles.trackDuration}>
            {formatDuration(track.duration)}
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.type === 'artist') {
      const artist = item.item as SearchArtist;
      return (
        <TouchableOpacity
          style={styles.artistItem}
          onPress={() => handleArtistPress(artist)}
        >
          <View style={styles.artistAvatar}>
            <Text style={styles.artistAvatarText}>
              {artist.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.artistInfo}>
            <Text style={styles.artistName} numberOfLines={1}>
              {renderHighlight(artist.highlight?.name, artist.name)}
            </Text>
            <Text style={styles.artistCount}>{artist.trackCount} 首歌曲</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === 'album') {
      const album = item.item as SearchAlbum;
      return (
        <TouchableOpacity
          style={styles.albumItem}
          onPress={() => handleAlbumPress(album)}
        >
          <View style={styles.albumIcon}>
            <Text style={styles.albumIconText}>💿</Text>
          </View>
          <View style={styles.albumInfo}>
            <Text style={styles.albumName} numberOfLines={1}>
              {renderHighlight(album.highlight?.name, album.name)}
            </Text>
            <Text style={styles.albumArtist} numberOfLines={1}>
              {album.artist || '未知艺术家'} · {album.trackCount} 首
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <Text style={styles.sectionTitle}>{section.title}</Text>
  );

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索歌曲、艺术家、专辑..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={search}
          autoFocus
          autoCapitalize="none"
        />
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => {
            if (item.type === 'track') return `track-${item.item.id}`;
            if (item.type === 'artist') return `artist-${item.item.name}`;
            return `album-${item.item.name}-${index}`;
          }}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
        />
      ) : query.length > 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>未找到相关结果</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.placeholderText}>输入关键词开始搜索</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  searchInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  list: {
    paddingBottom: 16,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  trackCoverPlaceholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackCoverText: {
    fontSize: 20,
    color: '#666',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  trackArtist: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  trackDuration: {
    color: '#666',
    fontSize: 13,
    marginLeft: 8,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  artistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  artistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  artistName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  artistCount: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  albumIcon: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumIconText: {
    fontSize: 24,
  },
  albumInfo: {
    flex: 1,
    marginLeft: 12,
  },
  albumName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  albumArtist: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
});
