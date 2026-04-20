import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

const menuItems = [
  { path: '/', label: '首页概览', icon: '📊' },
  { path: '/warehouse', label: '仓库管理', icon: '🏭' },
  { path: '/warehouse/locations', label: '库位管理', icon: '📍' },
  { path: '/warehouse/inventory', label: '库存查询', icon: '📋' },
  { path: '/order', label: '订单管理', icon: '📦' },
  { path: '/transport', label: '运单管理', icon: '🚚' },
  { path: '/transport/tracking', label: '配送跟踪', icon: '🗺️' },
  { path: '/transport/drivers', label: '司机管理', icon: '👤' },
  { path: '/transport/vehicles', label: '车辆管理', icon: '🚛' },
  { path: '/statistics', label: '数据统计', icon: '📈' },
  { path: '/system', label: '系统管理', icon: '⚙️' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <aside style={{ width: collapsed ? '60px' : '240px', backgroundColor: 'var(--color-sidebar-bg)', transition: 'width 0.2s', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🚢</span>
            {!collapsed && <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>综合物流平台</span>}
          </div>
        </div>

        {/* 菜单 */}
        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              style={{ marginBottom: '0.25rem', textDecoration: 'none' }}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* 底部用户信息 */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>
              {user?.displayName?.[0] || 'U'}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.displayName || '用户'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>{user?.roleCode === 'ADMIN' ? '管理员' : user?.username}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              style={{ width: '100%', padding: '0.375rem', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.375rem', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              退出登录
            </button>
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9' }}>
        {/* 顶部栏 */}
        <header style={{ height: '56px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem' }}
          >
            ☰
          </button>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </header>

        {/* 内容 */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
