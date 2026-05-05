import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore, useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { ScanState, AdminUser } from '../types';

export default function AdminPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const theme = useSettingsStore((s) => s.theme);
  const colors = useMemo(() => getColors(theme), [theme]);

  // Scan state
  const [scanState, setScanState] = useState<ScanState | null>(null);
  const [musicRoot, setMusicRoot] = useState('');
  const [editRoot, setEditRoot] = useState('');
  const [scanLoading, setScanLoading] = useState(true);
  const [startScanLoading, setStartScanLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // User management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Redirect non-admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const fetchScanStatus = useCallback(async () => {
    try {
      const res = await api.get<{ data: ScanState }>('/admin/scan/status');
      setScanState(res.data.data ?? null);
    } catch {
      // silent
    } finally {
      setScanLoading(false);
    }
  }, []);

  const fetchMusicRoot = useCallback(async () => {
    try {
      const res = await api.get<{ data: { path: string } }>('/admin/scan/music-root');
      const root = res.data.data?.path ?? '';
      setMusicRoot(root);
      setEditRoot(root);
    } catch {
      // silent
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get<{ data: AdminUser[] }>('/admin/users');
      setUsers(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScanStatus();
    fetchMusicRoot();
    fetchUsers();
  }, [fetchScanStatus, fetchMusicRoot, fetchUsers]);

  // Auto-refresh scan status when running
  useEffect(() => {
    if (scanState?.status === 'running') {
      pollRef.current = setInterval(fetchScanStatus, 2000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [scanState?.status, fetchScanStatus]);

  const handleStartScan = useCallback(async () => {
    setStartScanLoading(true);
    try {
      await api.post('/admin/scan');
      // Immediately fetch status
      await fetchScanStatus();
    } catch {
      // silent
    } finally {
      setStartScanLoading(false);
    }
  }, [fetchScanStatus]);

  const handleApprove = useCallback(
    async (userId: number) => {
      setApprovingId(userId);
      try {
        await api.patch(`/admin/users/${userId}/approve`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, approved: true } : u)),
        );
      } catch {
        // silent
      } finally {
        setApprovingId(null);
      }
    },
    [],
  );

  const sectionStyle: React.CSSProperties = {
    background: colors.surface,
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  };

  const renderScanProgress = () => {
    if (!scanState) return null;
    const { status, progress, startedAt, finishedAt } = scanState;

    const statusLabel: Record<string, string> = {
      idle: '空闲',
      running: '扫描中...',
      finished: '已完成',
      error: '出错',
    };

    const statusColor: Record<string, string> = {
      idle: colors.textMuted,
      running: colors.accent,
      finished: colors.success,
      error: colors.error,
    };

    return (
      <div style={{ marginTop: 12 }}>
        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: statusColor[status] ?? colors.textMuted,
              ...(status === 'running' ? { animation: 'pulse 1.5s infinite' } : {}),
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: statusColor[status] ?? colors.text }}>
            {statusLabel[status] ?? status}
          </span>
        </div>

        {/* Progress stats */}
        {progress && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: 8,
              marginTop: 8,
            }}
          >
            <div
              style={{
                background: colors.surfaceAlt,
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>
                {progress.scanned}
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                已扫描
              </div>
            </div>
            <div
              style={{
                background: colors.surfaceAlt,
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.success }}>
                +{progress.added}
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                新增
              </div>
            </div>
            <div
              style={{
                background: colors.surfaceAlt,
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>
                ~{progress.updated}
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                更新
              </div>
            </div>
            <div
              style={{
                background: colors.surfaceAlt,
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.error }}>
                -{progress.removed}
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                移除
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {progress && progress.total > 0 && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                height: 4,
                background: colors.surfaceAlt,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min((progress.scanned / progress.total) * 100, 100)}%`,
                  background: colors.accent,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              {progress.scanned} / {progress.total}
            </div>
          </div>
        )}

        {/* Timestamps */}
        {startedAt && (
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
            开始时间: {new Date(startedAt * 1000).toLocaleString('zh-CN')}
          </div>
        )}
        {finishedAt && (
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            完成时间: {new Date(finishedAt * 1000).toLocaleString('zh-CN')}
          </div>
        )}
      </div>
    );
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div style={{ padding: '0 20px 100px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '16px 0 20px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>
          管理控制台
        </h2>
      </div>

      {/* Music Library Scan Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>音乐库扫描</div>

        {/* Music root path */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: colors.text,
              display: 'block',
              marginBottom: 6,
            }}
          >
            音乐根目录
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={editRoot}
              onChange={(e) => setEditRoot(e.target.value)}
              placeholder="/path/to/music"
              style={{
                flex: 1,
                height: 36,
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: 8,
                padding: '0 12px',
                fontSize: 14,
                color: colors.inputText,
                outline: 'none',
                fontFamily: 'monospace',
              }}
              onFocus={(e) => (e.target.style.borderColor = colors.accent)}
              onBlur={(e) => (e.target.style.borderColor = colors.inputBorder)}
            />
          </div>
          {musicRoot && (
            <p style={{ fontSize: 12, color: colors.textMuted, margin: '4px 0 0' }}>
              当前目录: {musicRoot}
            </p>
          )}
        </div>

        {/* Scan status */}
        {scanLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <LoadingSpinner />
          </div>
        ) : (
          renderScanProgress()
        )}

        {/* Start scan button */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={handleStartScan}
            disabled={startScanLoading || scanState?.status === 'running'}
            style={{
              width: '100%',
              height: 40,
              background:
                scanState?.status === 'running'
                  ? colors.buttonSecondary
                  : colors.buttonPrimary,
              color:
                scanState?.status === 'running'
                  ? colors.buttonSecondaryText
                  : colors.buttonText,
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor:
                startScanLoading || scanState?.status === 'running'
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                startScanLoading || scanState?.status === 'running' ? 0.6 : 1,
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {startScanLoading ? (
              <LoadingSpinner size="sm" />
            ) : scanState?.status === 'running' ? (
              <>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    border: `2px solid ${colors.buttonSecondaryText}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                扫描进行中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
                开始扫描
              </>
            )}
          </button>
        </div>
      </div>

      {/* User Management Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>用户管理</div>

        {usersLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <LoadingSpinner />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '20px 0' }}>
            <EmptyState icon="users" title="暂无其他用户" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: u.approved
                      ? `linear-gradient(135deg, ${colors.accent}, #af52de)`
                      : colors.surfaceAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: u.approved ? '#fff' : colors.textMuted,
                    }}
                  >
                    {u.username.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: colors.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {u.username}
                    {u.role === 'admin' && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: colors.accent,
                          background: colors.activeBg,
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        管理员
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {u.approved ? '已批准' : '待批准'}
                  </div>
                </div>

                {/* Approve button */}
                {!u.approved && u.role !== 'admin' && (
                  <button
                    onClick={() => handleApprove(u.id)}
                    disabled={approvingId === u.id}
                    style={{
                      background: colors.buttonPrimary,
                      color: colors.buttonText,
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: approvingId === u.id ? 'wait' : 'pointer',
                      opacity: approvingId === u.id ? 0.6 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {approvingId === u.id ? '处理中...' : '批准'}
                  </button>
                )}

                {/* Approved badge */}
                {u.approved && (
                  <span
                    style={{
                      fontSize: 12,
                      color: colors.success,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pulse animation for running indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
