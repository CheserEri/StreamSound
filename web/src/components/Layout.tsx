import { useEffect, useState, useCallback, useMemo } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore, usePlayerStore, useSettingsStore } from '../store';
import MiniPlayer from './MiniPlayer';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Music Library', icon: '\uD83C\uDFB5' },
  { path: '/search', label: 'Search', icon: '\uD83D\uDD0D' },
  { path: '/favorites', label: 'Favorites', icon: '\u2764\uFE0F' },
  { path: '/history', label: 'Recently Played', icon: '\uD83D\uDD50' },
  { path: '/settings', label: 'Settings', icon: '\u2699\uFE0F' },
  { path: '/admin', label: 'Admin', icon: '\uD83D\uDEE1\uFE0F', adminOnly: true },
];

const mobileNavItems: NavItem[] = [
  { path: '/', label: 'Library', icon: '\uD83C\uDFB5' },
  { path: '/search', label: 'Search', icon: '\uD83D\uDD0D' },
  { path: '/favorites', label: 'Favorites', icon: '\u2764\uFE0F' },
  { path: '/settings', label: 'Settings', icon: '\u2699\uFE0F' },
];

function getPageTitle(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'Music Library';
  if (pathname.startsWith('/folder/')) return 'Folder';
  if (pathname === '/player') return 'Now Playing';
  if (pathname === '/queue') return 'Queue';
  if (pathname === '/search') return 'Search';
  if (pathname === '/favorites') return 'Favorites';
  if (pathname === '/history') return 'Recently Played';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/admin') return 'Admin';
  return 'StreamSound';
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const settingsLoad = useSettingsStore((s) => s.loadFromStorage);
  const initialize = usePlayerStore((s) => s.initialize);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize stores on mount
  useEffect(() => {
    loadFromStorage();
    settingsLoad();
    initialize();
  }, [loadFromStorage, settingsLoad, initialize]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar overlay is open
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, isMobile]);

  const filteredNavItems = useMemo(() => {
    if (!user || user.role !== 'admin') {
      return navItems.filter((item) => !item.adminOnly);
    }
    return navItems;
  }, [user]);

  const isActive = useCallback(
    (path: string) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
    },
    [location.pathname],
  );

  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleOverlayClick = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={handleOverlayClick}
        style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">S</div>
          <span className="sidebar-brand">StreamSound</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Browse</div>
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User info at bottom */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-4)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-bold)',
              flexShrink: 0,
            }}
          >
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.username || 'User'}
            </div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              {user?.role === 'admin' ? 'Admin' : 'User'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)',
              fontSize: 14,
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-hover)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-error)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
            }}
          >
            &#x2190;
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="header-title">{pageTitle}</h1>
          </div>
          <div className="header-right" />
        </header>

        {/* Page content */}
        <div className="main-content-inner">
          <Outlet />
        </div>
      </main>

      {/* Mini Player */}
      <MiniPlayer />

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
            background: 'var(--color-header-bg)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
            borderTop: '1px solid var(--color-header-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 'var(--z-sticky)' as unknown as number,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {mobileNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: '4px 0',
                  textDecoration: 'none',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontSize: 10,
                  fontWeight: active ? 'var(--font-semibold)' : 'var(--font-normal)',
                  transition: 'color var(--transition-fast)',
                  minWidth: 56,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
