import { useNavigate } from 'react-router-dom';
import { usePlayerStore, useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import { formatDuration, getCoverUrl } from '../utils/format';

export default function QueuePage() {
  const navigate = useNavigate();
  const theme = useSettingsStore((s) => s.theme);
  const colors = getColors(theme);

  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  const handleRemoveTrack = (index: number) => {
    if (index < 0 || index >= queue.length) return;
    const newQueue = [...queue];
    newQueue.splice(index, 1);
    let newIndex = currentIndex;
    if (index < currentIndex) {
      newIndex = currentIndex - 1;
    } else if (index === currentIndex) {
      // Removing current track: play next or stop
      if (newQueue.length === 0) {
        newIndex = -1;
      } else if (newIndex >= newQueue.length) {
        newIndex = 0;
      }
    }
    if (newQueue.length === 0) {
      // Just empty the queue visually - player store doesn't have a clear method
      setQueue(newQueue, 0);
    } else {
      setQueue(newQueue, Math.max(0, newIndex));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newQueue = [...queue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    let newIndex = currentIndex;
    if (currentIndex === index) newIndex = index - 1;
    else if (currentIndex === index - 1) newIndex = index;
    setQueue(newQueue, newIndex);
  };

  const handleMoveDown = (index: number) => {
    if (index >= queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    let newIndex = currentIndex;
    if (currentIndex === index) newIndex = index + 1;
    else if (currentIndex === index + 1) newIndex = index;
    setQueue(newQueue, newIndex);
  };

  const handleClearQueue = () => {
    if (queue.length === 0) return;
    setQueue([], 0);
  };

  const handleTrackClick = (index: number) => {
    setQueue(queue, index);
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
        }}
      >
        <h2 className="section-title">播放队列</h2>
        {queue.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleClearQueue}>
            清空队列
          </button>
        )}
      </div>

      {/* Now Playing */}
      {currentTrack && (
        <section
          style={{
            marginBottom: 'var(--space-6)',
            padding: 'var(--space-4)',
            background: colors.activeBg,
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: colors.activeText,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-3)',
            }}
          >
            正在播放
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                flexShrink: 0,
                background: colors.placeholder,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: colors.placeholderIcon,
              }}
            >
              {currentTrack.hasCover ? (
                <img
                  src={getCoverUrl(currentTrack.id)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                '♫'
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  color: colors.activeText,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentTrack.title}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  color: colors.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentTrack.artist || '未知艺术家'}
              </div>
            </div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: colors.textMuted,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {formatDuration(currentTrack.duration)}
            </div>
          </div>
        </section>
      )}

      {/* Queue List */}
      {queue.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-4)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)', opacity: 0.5 }}>🎶</div>
          <p style={{ color: colors.textSecondary }}>播放队列为空</p>
          <p style={{ fontSize: 'var(--text-sm)', color: colors.textMuted, marginTop: 'var(--space-2)' }}>
            去音乐库选择歌曲开始播放吧
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {queue.map((track, index) => {
            const isCurrent = index === currentIndex;
            return (
              <div
                key={`${track.id}-${index}`}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                  background: isCurrent ? colors.activeBg : 'transparent',
                  opacity: isCurrent ? 1 : 0.85,
                }}
                onClick={() => handleTrackClick(index)}
                onMouseEnter={(e) => {
                  if (!isCurrent)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTrackClick(index);
                }}
              >
                {/* Index */}
                <div
                  style={{
                    width: 24,
                    textAlign: 'center',
                    fontSize: 'var(--text-sm)',
                    color: isCurrent ? colors.activeText : colors.textMuted,
                    fontWeight: isCurrent ? 600 : 400,
                    flexShrink: 0,
                  }}
                >
                  {isCurrent ? '▶' : index + 1}
                </div>

                {/* Cover */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: colors.placeholder,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: colors.placeholderIcon,
                  }}
                >
                  {track.hasCover ? (
                    <img
                      src={getCoverUrl(track.id)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    '♫'
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: isCurrent ? 600 : 500,
                      color: isCurrent ? colors.activeText : colors.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.title}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: colors.textSecondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.artist || '未知艺术家'}
                  </div>
                </div>

                {/* Duration */}
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: colors.textMuted,
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  {formatDuration(track.duration)}
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: 2,
                    flexShrink: 0,
                    opacity: 0,
                    transition: 'opacity var(--transition-fast)',
                  }}
                  className="queue-actions"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.opacity = '1';
                  }}
                >
                  <button
                    className="btn btn-ghost"
                    style={{
                      width: 28,
                      height: 28,
                      padding: 0,
                      fontSize: 12,
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(index);
                    }}
                    disabled={index <= 0}
                    aria-label="上移"
                  >
                    ▲
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{
                      width: 28,
                      height: 28,
                      padding: 0,
                      fontSize: 12,
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(index);
                    }}
                    disabled={index >= queue.length - 1}
                    aria-label="下移"
                  >
                    ▼
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{
                      width: 28,
                      height: 28,
                      padding: 0,
                      fontSize: 14,
                      borderRadius: 'var(--radius-sm)',
                      color: colors.error,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTrack(index);
                    }}
                    aria-label="移除"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSS for hover actions */}
      <style>{`
        div:hover > .queue-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
