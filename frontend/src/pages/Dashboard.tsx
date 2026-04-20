import { useEffect, useState } from 'react'
import api, { ResultDTO } from '@/lib/api'

interface DashboardData {
  orders: {
    statusCounts: Record<string, number>
    totalOrders: number
  }
  warehouse: {
    completedOutbound: number
    totalInbound: number
    completedInbound: number
    totalOutbound: number
  }
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  '10': { label: '待确认', color: '#f59e0b', bg: '#fffbeb' },
  '20': { label: '已确认', color: '#3b82f6', bg: '#eff6ff' },
  '30': { label: '拣货中', color: '#8b5cf6', bg: '#f5f3ff' },
  '40': { label: '已出库', color: '#06b6d4', bg: '#f0fdfa' },
  '50': { label: '运输中', color: '#6366f1', bg: '#eef2ff' },
  '60': { label: '已到达', color: '#10b981', bg: '#ecfdf5' },
  '70': { label: '派送中', color: '#f97316', bg: '#fff7ed' },
  '80': { label: '已完成', color: '#059669', bg: '#ecfdf5' },
  '90': { label: '已取消', color: '#ef4444', bg: '#fef2f2' },
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ResultDTO<DashboardData>>('/statistics/dashboard')
      .then((res) => { if (res.data.code === 200) setData(res.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: '#64748b', padding: '2rem' }}>加载中...</div>

  const wh = data?.warehouse
  const oc = data?.orders

  return (
    <div>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>首页概览</h1>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#eff6ff', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>订单总数</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3b82f6' }}>{oc?.totalOrders ?? 0}</div>
            </div>
            <div style={{ fontSize: '1.75rem' }}>📦</div>
          </div>
        </div>
        <div style={{ backgroundColor: '#fffbeb', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>待处理订单</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b' }}>{(oc?.statusCounts['10'] ?? 0) + (oc?.statusCounts['20'] ?? 0)}</div>
            </div>
            <div style={{ fontSize: '1.75rem' }}>⏳</div>
          </div>
        </div>
        <div style={{ backgroundColor: '#ecfdf5', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>已完成入库</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981' }}>{wh?.completedInbound ?? 0} / {wh?.totalInbound ?? 0}</div>
            </div>
            <div style={{ fontSize: '1.75rem' }}>📥</div>
          </div>
        </div>
        <div style={{ backgroundColor: '#f0fdfa', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>已完成出库</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#14b8a6' }}>{wh?.completedOutbound ?? 0} / {wh?.totalOutbound ?? 0}</div>
            </div>
            <div style={{ fontSize: '1.75rem' }}>📤</div>
          </div>
        </div>
      </div>

      {/* 订单状态分布 */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>订单状态分布</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {Object.entries(oc?.statusCounts || {}).map(([status, count]) => {
            const info = statusLabels[status] || { label: `状态${status}`, color: '#64748b', bg: '#f1f5f9' }
            return (
              <div key={status} style={{ padding: '0.625rem 1rem', backgroundColor: info.bg, borderRadius: '0.5rem', minWidth: '90px' }}>
                <div style={{ fontSize: '0.7rem', color: info.color, fontWeight: 500 }}>{info.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: info.color }}>{count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 快捷操作 */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>快捷操作</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: '新建入库单', icon: '📥' },
            { label: '新建出库单', icon: '📤' },
            { label: '创建订单', icon: '➕' },
            { label: '创建运单', icon: '🚚' },
            { label: '库位管理', icon: '📍' },
            { label: '库存查询', icon: '🔍' },
          ].map((item) => (
            <div key={item.label}
              style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background-color 0.15s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.875rem', color: '#475569' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
