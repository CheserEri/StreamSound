import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { usePlayerActions } from '../hooks/usePlayer';
import { usePlayerStore } from '../store';
import { getCoverUrl } from '../services/player';
import FastImage from 'react-native-fast-image';
import { formatDuration, getModeIcon } from '../utils/format';
import type { TrackListItem } from '../types';

export default function QueueScreen() {
  const { playTracks, toggleMode } = usePlayerActions();
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const mode = usePlayerStore((s) => s.mode);
  const [editMode, setEditMode] = useState(false);

  const handleTrackPress = (index: number) => {
    if (queue.length > 0) {
      playTracks(queue, index);
    }
  };

  const handleRemoveTrack = (index: number) => {
    Alert.alert('提示', '确定从队列中移除？', [
      { text: '取消', style: 'cancel' },
      {
        text: '移除',
        style: 'destructive',
        onPress: () => {
          const newQueue = queue.filter((_, i) => i !== index);
          const newCurrentIndex =
            index < currentIndex
              ? currentIndex - 1
              : index === currentIndex
                ? Math.min(currentIndex, newQueue.length - 1)
                : currentIndex;
          if (newQueue.length > 0) {
            playTracks(newQueue, Math.max(0, newCurrentIndex));
          }
        },
      },
    ]);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newQueue = [...queue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    const newCurrentIndex =
      index - 1 === currentIndex
        ? index
        : index === currentIndex
          ? currentIndex - 1
          : currentIndex;
    playTracks(newQueue, newCurrentIndex);
  };

  const handleMoveDown = (index: number) => {
    if (index >= queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    const newCurrentIndex =
      index === currentIndex
        ? currentIndex + 1
        : index + 1 === currentIndex
          ? currentIndex - 1
          : currentIndex;
    playTracks(newQueue, newCurrentIndex);
  };

  return (
    <View style={styles.container}>
      {/* Header actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.headerButton, editMode && styles.headerButtonActive]}
          onPress={() => setEditMode(!editMode)}
        >
          <Text style={styles.headerButtonText}>{editMode ? '完成' : '编辑'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton} onPress={toggleMode}>
          <Text style={styles.modeIcon}>{getModeIcon(mode)}</Text>
        </TouchableOpacity>
      </View>

      {/* Queue info */}
      <View style={styles.queueInfo}>
        <Text style={styles.queueInfoText}>
          {queue.length} 首歌曲
          {mode === 'shuffle' ? ' · 随机播放' : mode === 'repeat' ? ' · 单曲循环' : ''}
        </Text>
      </View>

      {/* Queue list */}
      <FlatList
        data={queue}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item, index }) => {
          const isCurrentTrack = index === currentIndex;
          return (
            <TouchableOpacity
              style={[
                styles.trackItem,
                isCurrentTrack && styles.trackItemActive,
              ]}
              onPress={() => !editMode && handleTrackPress(index)}
              onLongPress={() => setEditMode(true)}
            >
              {editMode ? (
                <View style={styles.editControls}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <Text style={[styles.editButtonText, index === 0 && styles.editButtonDisabled]}>
                      ▲
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleMoveDown(index)}
                    disabled={index === queue.length - 1}
                  >
                    <Text
                      style={[
                        styles.editButtonText,
                        index === queue.length - 1 && styles.editButtonDisabled,
                      ]}
                    >
                      ▼
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.trackIndex}>
                  {isCurrentTrack ? (
                    <Text style={styles.playingIcon}>▶</Text>
                  ) : (
                    <Text style={styles.trackIndexText}>{index + 1}</Text>
                  )}
                </View>
              )}

              {item.hasCover ? (
                <FastImage
                  source={{ uri: getCoverUrl(item.id) }}
                  style={styles.trackCover}
                />
              ) : (
                <View style={[styles.trackCover, styles.trackCoverPlaceholder]}>
                  <Text style={styles.trackCoverText}>♪</Text>
                </View>
              )}

              <View style={styles.trackInfo}>
                <Text
                  style={[
                    styles.trackTitle,
                    isCurrentTrack && styles.trackTitleActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {item.artist || '未知艺术家'}
                </Text>
              </View>

              <Text style={styles.trackDuration}>
                {formatDuration(item.duration)}
              </Text>

              {editMode && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveTrack(index)}
                >
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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1e1e1e',
  },
  headerButtonActive: {
    backgroundColor: '#2563eb',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modeIcon: {
    fontSize: 16,
  },
  queueInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  queueInfoText: {
    color: '#888',
    fontSize: 13,
  },
  list: {
    paddingVertical: 8,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  trackItemActive: {
    backgroundColor: '#1a1a2e',
  },
  editControls: {
    flexDirection: 'column',
    marginRight: 8,
    gap: 2,
  },
  editButton: {
    width: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 10,
  },
  editButtonDisabled: {
    color: '#444',
  },
  trackIndex: {
    width: 28,
    alignItems: 'center',
  },
  trackIndexText: {
    color: '#666',
    fontSize: 13,
  },
  playingIcon: {
    color: '#2563eb',
    fontSize: 12,
  },
  trackCover: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  trackCoverPlaceholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackCoverText: {
    fontSize: 18,
    color: '#666',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  trackTitleActive: {
    color: '#2563eb',
  },
  trackArtist: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  trackDuration: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 14,
  },
});
