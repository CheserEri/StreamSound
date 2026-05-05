import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import type { Folder } from '../types';

export default function LibraryPage() {
  const navigate = useNavigate();
  const theme = useSettingsStore((s) => s.theme);
  const colors = getColors(theme);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/library/folders');
      setFolders(res.data.data ?? []);
    } catch {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const quickActions = [
    { label: '搜索', icon: '🔍', color: colors.actionSearch, path: '/search' },
    { label: '收藏', icon: '♥', color: colors.actionFavorites, path: '/favorites' },
    { label: '最近播放', icon: '🕐', color: colors.actionHistory, path: '/history' },
    { label: '设置', icon: '⚙', color: colors.actionSettings, path: '/settings' },
  ];

  return (
    <div>
      {/* Quick Actions */}
      <section className="section">
        <div className="quick-actions">
          {quickActions.map((action) => (
            <div
              key={action.path}
              className="quick-action"
              onClick={() => navigate(action.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(action.path);
              }}
            >
              <div className="quick-action-icon" style={{ background: action.color }}>
                {action.icon}
              </div>
              <span className="quick-action-label">{action.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Folder List */}
      <section className="section">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)',
          }}
        >
          <h2 className="section-title">音乐库</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchFolders}
            disabled={loading}
            style={{ gap: 'var(--space-1)' }}
          >
            <span
              style={{
                display: 'inline-block',
                animation: loading ? 'spin 0.8s linear infinite' : 'none',
              }}
            >
              ↻
            </span>
            刷新
          </button>
        </div>

        {loading && folders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 60, borderRadius: 'var(--radius-lg)' }}
              />
            ))}
          </div>
        ) : error && folders.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-10) var(--space-4)',
            }}
          >
            <div
              style={{
                fontSize: 40,
                marginBottom: 'var(--space-3)',
                opacity: 0.5,
              }}
            >
              📁
            </div>
            <p style={{ color: colors.textSecondary, marginBottom: 'var(--space-4)' }}>{error}</p>
            <button className="btn btn-secondary" onClick={fetchFolders}>
              重试
            </button>
          </div>
        ) : folders.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-10) var(--space-4)',
            }}
          >
            <div
              style={{
                fontSize: 40,
                marginBottom: 'var(--space-3)',
                opacity: 0.5,
              }}
            >
              📁
            </div>
            <p style={{ color: colors.textSecondary }}>暂无音乐文件夹</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {folders.map((folder, index) => (
              <div
                key={folder.id}
                className="animate-slide-up"
                style={{
                  animationDelay: `${index * 30}ms`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                  background: 'transparent',
                }}
                onClick={() =>
                  navigate(`/folder/${folder.id}/${encodeURIComponent(folder.name)}`)
                }
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    navigate(`/folder/${folder.id}/${encodeURIComponent(folder.name)}`);
                }}
              >
                {/* Folder Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: colors.surfaceAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  📁
                </div>

                {/* Folder Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                      color: colors.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {folder.name}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {folder.trackCount} 首歌曲
                  </div>
                </div>

                {/* Arrow */}
                <div
                  style={{
                    color: colors.textMuted,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  ›
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
