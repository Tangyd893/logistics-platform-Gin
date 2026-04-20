import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, Table, Badge } from '@/components/Table'
import api, { ResultDTO, PageDTO } from '@/lib/api'

interface Waybill {
  id: number
  waybillNo: string
  orderNo: string
  driverName: string | null
  driverPhone: string | null
  vehiclePlate: string | null
  fromAddress: string | null
  toAddress: string | null
  status: number
  statusName: string
  createdAt: string
}

// 运单状态 1=待提货 2=配送中 3=已送达 4=拒收
const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  1: { label: '待提货', variant: 'warning' },
  2: { label: '配送中', variant: 'default' },
  3: { label: '已送达', variant: 'success' },
  4: { label: '拒收/取消', variant: 'danger' },
}

// 状态推进按钮：当前状态 → 可执行的操作
type ActionDef = { next: number; label: string; color: string; bg: string; endpoint: string; method: string }
const actionMap: Record<number, ActionDef> = {
  1: { next: 2, label: '📦 确认提货',    color: '#3b82f6', bg: '#eff6ff', endpoint: 'confirm-pickup',    method: 'POST' },
  2: { next: 3, label: '🏁 确认送达',    color: '#10b981', bg: '#ecfdf5', endpoint: 'confirm-delivery', method: 'POST' },
  3: { next: 4, label: '❌ 标记拒收',    color: '#ef4444', bg: '#fef2f2', endpoint: 'reject',          method: 'POST' },
}

export default function TransportList() {
  const [data, setData] = useState<Waybill[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ id: number; type: 'ok' | 'err'; text: string } | null>(null)
  const navigate = useNavigate()

  const fetchData = () => {
    setLoading(true)
    api.get<ResultDTO<PageDTO<Waybill>>>('/transport/waybills').then((res) => {
      if (res.data.code === 200) setData(res.data.data.records)
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const advance = async (id: number, action: ActionDef) => {
    if (!confirm(`确定「${action.label}」？`)) return
    try {
      const res = await api.post(`/transport/waybills/${id}/${action.endpoint}`)
      if (res.data.code === 200) {
        setMsg({ id, type: 'ok', text: action.label + '成功' })
        fetchData()
      } else {
        setMsg({ id, type: 'err', text: res.data.message || '操作失败' })
      }
    } catch (e: any) {
      setMsg({ id, type: 'err', text: e.response?.data?.message || '网络错误' })
    }
    // 3秒后清除消息
    setTimeout(() => setMsg(null), 3000)
  }

  const columns = [
    { key: 'id', label: 'ID', width: '50px' },
    {
      key: 'waybillNo', label: '运单号', width: '170px',
      render: (row: Waybill) => (
        <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
          onClick={() => { sessionStorage.setItem('tracking_waybill_id', String(row.id)); navigate('/transport/tracking') }}
        >{row.waybillNo}</span>
      )
    },
    { key: 'orderNo', label: '订单号', width: '165px', render: (row: Waybill) => <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{row.orderNo}</span> },
    { key: 'driverName', label: '司机', width: '80px', render: (row: Waybill) => row.driverName || '-' },
    { key: 'driverPhone', label: '电话', width: '115px', render: (row: Waybill) => row.driverPhone || '-' },
    { key: 'vehiclePlate', label: '车牌', width: '95px', render: (row: Waybill) => row.vehiclePlate || '-' },
    { key: 'fromAddress', label: '起点', width: '125px', render: (row: Waybill) => <span style={{ fontSize: '0.75rem' }}>{row.fromAddress ? row.fromAddress.slice(0, 12) + '…' : '-'}</span> },
    { key: 'toAddress', label: '终点', width: '125px', render: (row: Waybill) => <span style={{ fontSize: '0.75rem' }}>{row.toAddress ? row.toAddress.slice(0, 12) + '…' : '-'}</span> },
    { key: 'status', label: '状态', width: '90px', render: (row: Waybill) => <Badge variant={statusMap[row.status]?.variant || 'default'}>{row.statusName}</Badge> },
    {
      key: '_actions', label: '操作', width: '140px', render: (row: Waybill) => {
        const action = actionMap[row.status]
        if (!action) return <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>—</span>
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {msg && msg.id === row.id && (
              <div style={{ fontSize: '0.72rem', color: msg.type === 'ok' ? '#10b981' : '#ef4444' }}>{msg.text}</div>
            )}
            <button
              onClick={() => advance(row.id, action)}
              style={{
                fontSize: '0.72rem', fontWeight: 600,
                border: `1px solid ${action.color}`,
                backgroundColor: action.bg, color: action.color,
                padding: '0.15rem 0.4rem', borderRadius: '0.25rem', cursor: 'pointer',
              }}
            >
              {action.label}
            </button>
          </div>
        )
      }
    },
  ]

  return (
    <div>
      <PageHeader
        title="运输管理"
        subtitle="管理运输任务与跟踪"
        action={
          <button
            onClick={() => navigate('/transport/new')}
            style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
          >
            + 新建运单
          </button>
        }
      />
      <Card>
        <Table columns={columns} data={data} loading={loading} emptyText="暂无运单数据" />
      </Card>
    </div>
  )
}
