import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { ResultDTO, PageDTO } from '@/lib/api'

interface Warehouse {
  id: number
  code: string
  name: string
  address: string
  manager: string | null
  phone: string | null
  totalCapacity: number
  usedCapacity: number
  availableCapacity: number
  status: number
  statusName: string
}

interface InboundOrder {
  id: number
  orderNo: string
  warehouseName: string
  supplierName: string
  inboundTypeName: string
  status: number
  statusName: string
  actualArrivalTime: string
  createdAt: string
}

interface OutboundOrder {
  id: number
  orderNo: string
  warehouseName: string
  customerName: string
  outboundTypeName: string
  status: number
  statusName: string
  createdAt: string
}

const inboundStatus: Record<number, string> = {
  10: '待入库', 20: '入库中', 40: '已完成', 90: '已取消'
}
const outboundStatus: Record<number, string> = {
  10: '待出库', 20: '拣货中', 40: '已出库', 90: '已取消'
}

export default function WarehouseDetail() {
  const { tab } = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const currentTab = tab || 'inbound'
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [inbounds, setInbounds] = useState<InboundOrder[]>([])
  const [outbounds, setOutbounds] = useState<OutboundOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<ResultDTO<Warehouse[]>>('/warehouse/warehouses/all'),
      api.get<ResultDTO<PageDTO<InboundOrder>>>('/warehouse/inbound-orders'),
      api.get<ResultDTO<PageDTO<OutboundOrder>>>('/warehouse/outbound-orders'),
    ]).then(([whRes, inRes, outRes]) => {
      if (whRes.data.code === 200) setWarehouse(whRes.data.data[0])
      if (inRes.data.code === 200) setInbounds(inRes.data.data.records)
      if (outRes.data.code === 200) setOutbounds(outRes.data.data.records)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const tabStyle = (t: string) => ({
    padding: '0.5rem 1rem',
    color: currentTab === t ? '#3b82f6' : '#64748b',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    background: 'none',
    border: 'none',
    borderBottom: currentTab === t ? '2px solid #3b82f6' : '2px solid transparent',
  })

  const Badge = ({ status }: { status: number }) => {
    const map = currentTab === 'inbound' ? inboundStatus : outboundStatus
    const labels: Record<number, { label: string; color: string; bg: string }> = {
      10: { label: map[10] || '待处理', color: '#f59e0b', bg: '#fffbeb' },
      20: { label: map[20] || '处理中', color: '#3b82f6', bg: '#eff6ff' },
      40: { label: map[40] || '已完成', color: '#10b981', bg: '#ecfdf5' },
      90: { label: map[90] || '已取消', color: '#ef4444', bg: '#fef2f2' },
    }
    const info = labels[status] || { label: `状态${status}`, color: '#64748b', bg: '#f1f5f9' }
    return <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', backgroundColor: info.bg, color: info.color }}>{info.label}</span>
  }

  const colStyle = { padding: '0.625rem 1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }
  const thStyle = { ...colStyle, backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', textAlign: 'left' as const }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/warehouse')} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>{warehouse?.name || '仓库详情'}</h1>
      </div>

      {/* 仓库信息卡片 */}
      {warehouse && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <div><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>仓库编码</div><div style={{ fontWeight: 600, color: '#1e293b' }}>{warehouse.code}</div></div>
          <div><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>地址</div><div style={{ color: '#475569' }}>{warehouse.address}</div></div>
          <div><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>负责人</div><div style={{ color: '#475569' }}>{warehouse.manager || '-'}</div></div>
          <div><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>容量使用</div><div style={{ color: '#475569' }}>{warehouse.usedCapacity} / {warehouse.totalCapacity}</div></div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
        <button style={tabStyle('inbound')} onClick={() => navigate('/warehouse/inbound')}>入库记录</button>
        <button style={tabStyle('outbound')} onClick={() => navigate('/warehouse/outbound')}>出库记录</button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>加载中...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>单号</th>
                <th style={thStyle}>类型</th>
                <th style={thStyle}>客户/供应商</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>时间</th>
              </tr>
            </thead>
            <tbody>
              {(currentTab === 'inbound' ? inbounds : outbounds).map((row) => (
                <tr key={row.id}>
                  <td style={colStyle}>{'orderNo' in row ? row.orderNo : '-'}</td>
                  <td style={colStyle}>{'inboundTypeName' in row ? row.inboundTypeName : 'outboundTypeName' in row ? row.outboundTypeName : '-'}</td>
                  <td style={colStyle}>{'supplierName' in row ? row.supplierName : 'customerName' in row ? row.customerName : '-'}</td>
                  <td style={colStyle}><Badge status={row.status} /></td>
                  <td style={colStyle}>{('actualArrivalTime' in row ? row.actualArrivalTime : row.createdAt)?.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
              {!(currentTab === 'inbound' ? inbounds : outbounds).length && (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
