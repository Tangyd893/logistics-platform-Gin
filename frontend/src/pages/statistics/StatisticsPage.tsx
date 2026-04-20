import { useEffect, useState } from 'react'
import { PageHeader, Card } from '@/components/Table'
import api, { ResultDTO } from '@/lib/api'
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DashboardData {
  orders: { statusCounts: Record<string, number>; totalOrders: number }
  warehouse: { completedOutbound: number; totalInbound: number; completedInbound: number; totalOutbound: number }
}

const ORDER_STATUS = [
  { key: '10', label: '待确认', color: '#f59e0b' },
  { key: '20', label: '已确认', color: '#3b82f6' },
  { key: '30', label: '拣货中', color: '#8b5cf6' },
  { key: '40', label: '已出库', color: '#06b6d4' },
  { key: '50', label: '运输中', color: '#6366f1' },
  { key: '60', label: '已到达', color: '#10b981' },
  { key: '70', label: '派送中', color: '#f97316' },
  { key: '80', label: '已完成', color: '#059669' },
  { key: '90', label: '已取消', color: '#ef4444' },
]

export default function StatisticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ResultDTO<DashboardData>>('/statistics/dashboard')
      .then((res) => { if (res.data.code === 200) setData(res.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: '#64748b', padding: '2rem' }}>加载中...</div>

  const statusCounts = data?.orders?.statusCounts || {}
  const pieData = ORDER_STATUS.map((s) => ({
    name: s.label,
    value: statusCounts[s.key] || 0,
    color: s.color,
  })).filter((d) => d.value > 0)

  const whData = [
    { name: '入库', 完成: data?.warehouse?.completedInbound || 0, 合计: data?.warehouse?.totalInbound || 0 },
    { name: '出库', 完成: data?.warehouse?.completedOutbound || 0, 合计: data?.warehouse?.totalOutbound || 0 },
  ]

  const totalOrders = data?.orders?.totalOrders || 0

  return (
    <div>
      <PageHeader title="数据统计" subtitle="业务数据分析与可视化" />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>订单总数</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{totalOrders}</div>
        </Card>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>本周入库</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{data?.warehouse?.totalInbound ?? 0}</div>
        </Card>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>本周出库</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#06b6d4' }}>{data?.warehouse?.totalOutbound ?? 0}</div>
        </Card>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>已完成</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{(statusCounts['80'] || 0)}</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* 订单状态分布 */}
        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>订单状态分布</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => String(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>暂无数据</div>
          )}
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {ORDER_STATUS.map((s) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label} ({statusCounts[s.key] || 0})</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 仓储统计 */}
        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>仓储收发统计</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={whData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="合计" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="合计" />
              <Bar dataKey="完成" fill="#10b981" radius={[4, 4, 0, 0]} name="完成" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
