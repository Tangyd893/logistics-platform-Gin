import { useState } from 'react'
import UserSection from './UserSection'
import RolePage from './RolePage'
import DeptPage from './DeptPage'
import MenuPage from './MenuPage'

type Tab = 'users' | 'roles' | 'depts' | 'menus'

const tabs: { key: Tab; label: string }[] = [
  { key: 'users', label: '用户管理' },
  { key: 'roles', label: '角色管理' },
  { key: 'depts', label: '部门管理' },
  { key: 'menus', label: '菜单管理' },
]

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users')

  return (
    <div>
      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1rem', backgroundColor: 'white', borderRadius: '0.75rem', padding: '0.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              backgroundColor: activeTab === t.key ? '#3b82f6' : 'transparent',
              color: activeTab === t.key ? 'white' : '#64748b',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {activeTab === 'users' && <UserSection />}
      {activeTab === 'roles' && <RolePage />}
      {activeTab === 'depts' && <DeptPage />}
      {activeTab === 'menus' && <MenuPage />}
    </div>
  )
}
