import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { usePlayerActions } from '../hooks/usePlayer';
import { usePlayerStore, useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import { getCoverUrl } from '../services/player';
import FastImage from 'react-native-fast-image';
import { formatDuration, getModeIcon } from '../utils/format';
import { PlayIcon, MusicNoteIcon } from '../components/icons';
import type { TrackListItem } from '../types';

export default function QueueScreen() {
  const { playTracks, toggleMode } = usePlayerActions();
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const mode = usePlayerStore((s) => s.mode);
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);
  const [editMode, setEditMode] = useState(false);

  const handleTrackPress = (index: number) => { if (queue.length > 0) playTracks(queue, index); };

  const handleRemoveTrack = (index: number) => {
    Alert.alert('提示', '确定从队列中移除？', [
      { text: '取消', style: 'cancel' },
      { text: '移除', style: 'destructive', onPress: () => {
        const newQueue = queue.filter((_, i) => i !== index);
        const newCurrentIndex = index < currentIndex ? currentIndex - 1 : index === currentIndex ? Math.min(currentIndex, newQueue.length - 1) : currentIndex;
        if (newQueue.length > 0) playTracks(newQueue, Math.max(0, newCurrentIndex));
      }},
    ]);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newQueue = [...queue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    playTracks(newQueue, index - 1 === currentIndex ? index : index === currentIndex ? currentIndex - 1 : currentIndex);
  };

  const handleMoveDown = (index: number) => {
    if (index >= queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    playTracks(newQueue, index === currentIndex ? currentIndex + 1 : index + 1 === currentIndex ? currentIndex - 1 : currentIndex);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerActions}>
        <TouchableOpacity style={[styles.headerButton, editMode && styles.headerButtonActive, !editMode && { backgroundColor: colors.surface }]} onPress={() => setEditMode(!editMode)}>
          <Text style={styles.headerButtonText}>{editMode ? '完成' : '编辑'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerButton, { backgroundColor: colors.surface }]} onPress={toggleMode}>
          <Text style={styles.modeIcon}>{getModeIcon(mode)}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.queueInfo, { borderBottomColor: colors.border }]}>
        <Text style={[styles.queueInfoText, { color: colors.textSecondary }]}>
          {queue.length} 首歌曲{mode === 'shuffle' ? ' · 随机播放' : mode === 'repeat' ? ' · 单曲循环' : ''}
        </Text>
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item, index }) => {
          const isCurrentTrack = index === currentIndex;
          return (
            <TouchableOpacity
              style={[styles.trackItem, isCurrentTrack && { backgroundColor: colors.activeBg }]}
              onPress={() => !editMode && handleTrackPress(index)}
              onLongPress={() => setEditMode(true)}
            >
              {editMode ? (
                <View style={styles.editControls}>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleMoveUp(index)} disabled={index === 0}>
                    <Text style={[styles.editButtonText, index === 0 && styles.editButtonDisabled]}>▲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleMoveDown(index)} disabled={index === queue.length - 1}>
                    <Text style={[styles.editButtonText, index === queue.length - 1 && styles.editButtonDisabled]}>▼</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.trackIndex}>
                  {isCurrentTrack ? <PlayIcon size={14} color={colors.accent} /> : <Text style={[styles.trackIndexText, { color: colors.textMuted }]}>{index + 1}</Text>}
                </View>
              )}
              {item.hasCover ? (
                <FastImage source={{ uri: getCoverUrl(item.id) }} style={styles.trackCover} />
              ) : (
                <View style={[styles.trackCover, { backgroundColor: colors.placeholder, justifyContent: 'center', alignItems: 'center' }]}>
                  <MusicNoteIcon size={18} color={colors.placeholderIcon} />
                </View>
              )}
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: isCurrentTrack ? colors.activeText : colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>{item.artist || '未知艺术家'}</Text>
              </View>
              <Text style={[styles.trackDuration, { color: colors.textMuted }]}>{formatDuration(item.duration)}</Text>
              {editMode && (
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveTrack(index)}>
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  headerButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  headerButtonActive: { backgroundColor: '#2563eb' },
  headerButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  modeIcon: { fontSize: 16 },
  queueInfo: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  queueInfoText: { fontSize: 13 },
  list: { paddingVertical: 8 },
  trackItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  editControls: { flexDirection: 'column', marginRight: 8, gap: 2 },
  editButton: { width: 24, height: 20, justifyContent: 'center', alignItems: 'center' },
  editButtonText: { color: '#fff', fontSize: 10 },
  editButtonDisabled: { color: '#444' },
  trackIndex: { width: 28, alignItems: 'center' },
  trackIndexText: { fontSize: 13 },
  trackCover: { width: 44, height: 44, borderRadius: 6 },
  trackInfo: { flex: 1, marginLeft: 12 },
  trackTitle: { fontSize: 14, fontWeight: '500' },
  trackArtist: { fontSize: 12, marginTop: 2 },
  trackDuration: { fontSize: 12, marginLeft: 8 },
  removeButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  removeButtonText: { color: '#dc2626', fontSize: 14 },
});
