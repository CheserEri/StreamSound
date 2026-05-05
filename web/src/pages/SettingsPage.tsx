import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useSettingsStore } from '../store';
import { getColors } from '../theme/colors';
import type { Theme } from '../types';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const serverUrl = useSettingsStore((s) => s.serverUrl);
  const theme = useSettingsStore((s) => s.theme);
  const setServerUrl = useSettingsStore((s) => s.setServerUrl);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const [editUrl, setEditUrl] = useState(serverUrl);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);

  const colors = useMemo(() => getColors(theme), [theme]);

  const handleSaveUrl = useCallback(() => {
    if (editUrl.trim()) {
      setServerUrl(editUrl.trim());
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 2000);
    }
  }, [editUrl, setServerUrl]);

  const handleToggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

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

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 15,
    color: colors.text,
    fontWeight: 500,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 15,
    color: colors.textSecondary,
  };

  return (
    <div style={{ padding: '0 20px 100px', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '16px 0 20px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>
          设置
        </h2>
      </div>

      {/* Account Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>账户</div>
        <div style={rowStyle}>
          <span style={labelStyle}>用户名</span>
          <span style={valueStyle}>{user?.username ?? '-'}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>角色</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: user?.role === 'admin' ? colors.accent : colors.textSecondary,
              background: user?.role === 'admin' ? colors.activeBg : colors.surfaceAlt,
              padding: '2px 10px',
              borderRadius: 10,
            }}
          >
            {user?.role === 'admin' ? '管理员' : '普通用户'}
          </span>
        </div>
        {user?.role === 'admin' && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                width: '100%',
                background: colors.surfaceAlt,
                color: colors.text,
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = colors.surfaceAlt)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              管理控制台
            </button>
          </div>
        )}
      </div>

      {/* Server Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>服务器</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="服务器地址"
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
            }}
            onFocus={(e) => (e.target.style.borderColor = colors.accent)}
            onBlur={(e) => (e.target.style.borderColor = colors.inputBorder)}
          />
          <button
            onClick={handleSaveUrl}
            style={{
              height: 36,
              background: urlSaved ? colors.success : colors.buttonPrimary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
          >
            {urlSaved ? '已保存' : '保存'}
          </button>
        </div>
      </div>

      {/* Appearance Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>外观</div>
        <div style={rowStyle}>
          <span style={labelStyle}>主题</span>
          <button
            onClick={handleToggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: colors.surfaceAlt,
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = colors.surfaceAlt)}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill={colors.text} stroke="none">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill={colors.text} stroke="none">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="21" x2="12" y2="23" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
                <line x1="1" y1="12" x2="3" y2="12" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
                <line x1="21" y1="12" x2="23" y2="12" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            <span style={{ fontSize: 14, color: colors.text, fontWeight: 500 }}>
              {theme === 'dark' ? '深色' : '浅色'}
            </span>
          </button>
        </div>
        {/* Theme preview */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 48,
              borderRadius: 8,
              background: theme === 'dark' ? '#1c1c1e' : '#f5f5f7',
              border: `2px solid ${theme === 'dark' ? colors.accent : colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onClick={() => setTheme('dark')}
          >
            <span style={{ fontSize: 12, color: theme === 'dark' ? colors.accent : colors.textSecondary }}>
              深色
            </span>
          </div>
          <div
            style={{
              flex: 1,
              height: 48,
              borderRadius: 8,
              background: theme === 'light' ? '#f5f5f7' : '#1c1c1e',
              border: `2px solid ${theme === 'light' ? colors.accent : colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onClick={() => setTheme('light')}
          >
            <span style={{ fontSize: 12, color: theme === 'light' ? colors.accent : colors.textSecondary }}>
              浅色
            </span>
          </div>
        </div>
      </div>

      {/* Logout Section */}
      <div style={sectionStyle}>
        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              width: '100%',
              background: 'transparent',
              color: colors.error,
              border: `1px solid ${colors.error}`,
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.errorBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            退出登录
          </button>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: colors.text, margin: '0 0 12px' }}>
              确定要退出登录吗？
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  background: colors.buttonSecondary,
                  color: colors.buttonSecondaryText,
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  background: colors.error,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                确认退出
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Version */}
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
          StreamSound Web v0.1.0
        </p>
      </div>
    </div>
  );
}
