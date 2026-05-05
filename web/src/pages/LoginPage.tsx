import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useSettingsStore } from '../store';
import { setServerUrl } from '../services/api';
import { getColors } from '../theme/colors';
import type { ApiError } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const serverUrl = useSettingsStore((s) => s.serverUrl);
  const theme = useSettingsStore((s) => s.theme);
  const colors = getColors(theme);

  const [isRegister, setIsRegister] = useState(false);
  const [serverInput, setServerInput] = useState(serverUrl);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setServerInput(serverUrl);
  }, [serverUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedServer = serverInput.trim().replace(/\/+$/, '');
    if (!trimmedServer) {
      setError('请输入服务器地址');
      return;
    }
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    try {
      setServerUrl(trimmedServer);
      useSettingsStore.getState().setServerUrl(trimmedServer);

      if (isRegister) {
        const result = await register(username.trim(), password);
        if (!result.approved) {
          setError(result.message || '注册成功，请等待管理员审批');
          return;
        }
      } else {
        await login(username.trim(), password);
      }

      navigate('/', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: ApiError } };
      const msg = axiosErr?.response?.data?.error?.message;
      setError(msg || '连接失败，请检查服务器地址');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.background,
        padding: 'var(--space-4)',
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: 400,
          background: colors.surface,
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
              margin: '0 auto var(--space-4)',
            }}
          >
            S
          </div>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              color: colors.text,
              marginBottom: 'var(--space-1)',
            }}
          >
            StreamSound
          </h1>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: colors.textSecondary,
            }}
          >
            私有流媒体音乐
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Server URL */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: colors.textSecondary,
                marginBottom: 'var(--space-1)',
              }}
            >
              服务器地址
            </label>
            <input
              className="input"
              type="url"
              value={serverInput}
              onChange={(e) => setServerInput(e.target.value)}
              placeholder="https://your-server.com"
              autoComplete="url"
            />
          </div>

          {/* Username */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: colors.textSecondary,
                marginBottom: 'var(--space-1)',
              }}
            >
              用户名
            </label>
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: colors.textSecondary,
                marginBottom: 'var(--space-1)',
              }}
            >
              密码
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: 'var(--space-3)',
                background: colors.errorBg,
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                color: colors.error,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            className="btn btn-primary btn-block btn-lg"
            type="submit"
            disabled={isLoading}
            style={{ marginTop: 'var(--space-2)' }}
          >
            {isLoading ? (
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
            ) : isRegister ? (
              '注册'
            ) : (
              '登录'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-6)',
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={{ fontSize: 'var(--text-sm)' }}
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
      </div>
    </div>
  );
}
