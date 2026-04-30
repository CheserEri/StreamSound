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
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import { useSearch } from '../hooks/useSearch';
import { usePlayerActions } from '../hooks/usePlayer';
import MiniPlayer from '../components/MiniPlayer';
import CoverImage from '../components/CoverImage';
import { formatDuration } from '../utils/format';
import type { TrackListItem, SearchTrack, SearchArtist, SearchAlbum } from '../types';

interface Section {
  title: string;
  data: Array<{ type: 'track' | 'artist' | 'album'; item: any }>;
}

export default function SearchScreen() {
  const { query, result, isLoading, error, search } = useSearch();
  const { playTracks } = usePlayerActions();
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);

  const sections = useMemo<Section[]>(() => {
    if (!result) return [];
    const secs: Section[] = [];
    if (result.tracks.length > 0) secs.push({ title: '歌曲', data: result.tracks.map((t) => ({ type: 'track' as const, item: t })) });
    if (result.artists.length > 0) secs.push({ title: '艺术家', data: result.artists.map((a) => ({ type: 'artist' as const, item: a })) });
    if (result.albums.length > 0) secs.push({ title: '专辑', data: result.albums.map((a) => ({ type: 'album' as const, item: a })) });
    return secs;
  }, [result]);

  const handleTrackPress = useCallback((track: SearchTrack) => {
    const tracks: TrackListItem[] = result?.tracks.map((t) => ({ ...t, hasLyrics: false, folderId: 0 })) || [];
    const index = tracks.findIndex((t) => t.id === track.id);
    playTracks(tracks, index >= 0 ? index : 0);
  }, [result, playTracks]);

  const handleArtistPress = useCallback((artist: SearchArtist) => {
    const artistTracks = result?.tracks.filter((t) => t.artist === artist.name) || [];
    if (artistTracks.length > 0) playTracks(artistTracks.map((t) => ({ ...t, hasLyrics: false, folderId: 0 })), 0);
  }, [result, playTracks]);

  const handleAlbumPress = useCallback((album: SearchAlbum) => {
    const albumTracks = result?.tracks.filter((t) => t.album === album.name) || [];
    if (albumTracks.length > 0) playTracks(albumTracks.map((t) => ({ ...t, hasLyrics: false, folderId: 0 })), 0);
  }, [result, playTracks]);

  const renderHighlight = (text: string | undefined, fallback: string) => text ? text.replace(/<\/?em>/g, '') : fallback;

  const renderItem = ({ item }: { item: { type: string; item: any } }) => {
    if (item.type === 'track') {
      const track = item.item as SearchTrack;
      return (
        <TouchableOpacity style={styles.trackItem} onPress={() => handleTrackPress(track)}>
          <CoverImage trackId={track.id} hasCover={track.hasCover} size={48} />
          <View style={styles.trackInfo}>
            <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>{renderHighlight(track.highlight?.title, track.title)}</Text>
            <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>{renderHighlight(track.highlight?.artist, track.artist || '未知艺术家')}</Text>
          </View>
          <Text style={[styles.trackDuration, { color: colors.textMuted }]}>{formatDuration(track.duration)}</Text>
        </TouchableOpacity>
      );
    }
    if (item.type === 'artist') {
      const artist = item.item as SearchArtist;
      return (
        <TouchableOpacity style={styles.artistItem} onPress={() => handleArtistPress(artist)}>
          <View style={styles.artistAvatar}><Text style={styles.artistAvatarText}>{artist.name.charAt(0).toUpperCase()}</Text></View>
          <View style={styles.artistInfo}>
            <Text style={[styles.artistName, { color: colors.text }]} numberOfLines={1}>{renderHighlight(artist.highlight?.name, artist.name)}</Text>
            <Text style={[styles.artistCount, { color: colors.textSecondary }]}>{artist.trackCount} 首歌曲</Text>
          </View>
        </TouchableOpacity>
      );
    }
    if (item.type === 'album') {
      const album = item.item as SearchAlbum;
      return (
        <TouchableOpacity style={styles.albumItem} onPress={() => handleAlbumPress(album)}>
          <View style={[styles.albumIcon, { backgroundColor: colors.surfaceAlt }]}><Text style={styles.albumIconText}>💿</Text></View>
          <View style={styles.albumInfo}>
            <Text style={[styles.albumName, { color: colors.text }]} numberOfLines={1}>{renderHighlight(album.highlight?.name, album.name)}</Text>
            <Text style={[styles.albumArtist, { color: colors.textSecondary }]} numberOfLines={1}>{album.artist || '未知艺术家'} · {album.trackCount} 首</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.inputBg, color: colors.inputText }]}
          placeholder="搜索歌曲、艺术家、专辑..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={search}
          autoFocus
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.textSecondary} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={{ color: '#ff4444', fontSize: 14 }}>{error}</Text></View>
      ) : sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.type === 'track' ? `track-${item.item.id}` : item.type === 'artist' ? `artist-${item.item.name}` : `album-${item.item.name}-${index}`}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.list, { paddingBottom: 76 }]}
        />
      ) : query.length > 0 ? (
        <View style={styles.center}><Text style={{ color: colors.textSecondary, fontSize: 14 }}>未找到相关结果</Text></View>
      ) : (
        <View style={styles.center}><Text style={{ color: colors.textMuted, fontSize: 14 }}>输入关键词开始搜索</Text></View>
      )}

      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  searchInput: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  list: { paddingBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, textTransform: 'uppercase' },
  trackItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  trackInfo: { flex: 1, marginLeft: 12 },
  trackTitle: { fontSize: 15, fontWeight: '500' },
  trackArtist: { fontSize: 13, marginTop: 2 },
  trackDuration: { fontSize: 13, marginLeft: 8 },
  artistItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  artistAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  artistAvatarText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  artistInfo: { flex: 1, marginLeft: 12 },
  artistName: { fontSize: 15, fontWeight: '500' },
  artistCount: { fontSize: 13, marginTop: 2 },
  albumItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  albumIcon: { width: 48, height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  albumIconText: { fontSize: 24 },
  albumInfo: { flex: 1, marginLeft: 12 },
  albumName: { fontSize: 15, fontWeight: '500' },
  albumArtist: { fontSize: 13, marginTop: 2 },
});
