import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, Table, Badge } from '@/components/Table'
import api, { ResultDTO, PageDTO } from '@/lib/api'

interface OrderItem { id: number; skuName: string; skuCode: string; quantity: number; unitPrice: number }
interface Order {
  id: number; orderNo: string; customerId: number | null; customerName: string | null
  senderName: string; senderPhone: string; senderAddress: string
  receiverName: string; receiverPhone: string; receiverAddress: string
  totalAmount: number; weightKg: number; volumeCbm: number
  status: number; statusName: string; remark: string | null
  createdBy: string | null; creatorName: string | null; createdAt: string
  items: OrderItem[]; logs: any[]
}

// 状态与后端 OrderService.getStatusName() 完全一致
const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  10: { label: '待确认', variant: 'warning' },
  20: { label: '已确认', variant: 'default' },
  30: { label: '已入库', variant: 'default' },
  40: { label: '已发货', variant: 'default' },
  50: { label: '运输中', variant: 'warning' },
  60: { label: '已送达', variant: 'success' },
  70: { label: '已完成', variant: 'success' },
  80: { label: '已取消', variant: 'danger' },
}

const allStatuses = Object.entries(statusMap).map(([k, v]) => ({ value: Number(k), label: v.label }))

export default function OrderList() {
  const [data, setData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const navigate = useNavigate()

  const fetchData = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    api.get<ResultDTO<PageDTO<Order>>>('/order/orders', { params }).then((res) => {
      if (res.data.code === 200) setData(res.data.data.records)
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [statusFilter])

  const columns = [
    { key: 'id', label: 'ID', width: '50px' },
    { key: 'orderNo', label: '订单号', width: '170px', render: (row: Order) =>
      <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate(`/order/${row.id}`)}>{row.orderNo}</span>
    },
    { key: 'senderName', label: '发货人', width: '100px' },
    { key: 'senderPhone', label: '发货电话', width: '115px' },
    { key: 'receiverName', label: '收货人', width: '100px' },
    { key: 'receiverPhone', label: '收货电话', width: '115px' },
    { key: 'totalAmount', label: '金额', width: '90px', render: (row: Order) => <span style={{ fontWeight: 600, color: '#ef4444' }}>¥{row.totalAmount.toFixed(2)}</span> },
    { key: 'status', label: '状态', width: '90px', render: (row: Order) => <Badge variant={statusMap[row.status]?.variant || 'default'}>{row.statusName}</Badge> },
    { key: 'createdAt', label: '下单时间', width: '160px', render: (row: Order) => row.createdAt?.slice(0, 16).replace('T', ' ') },
  ]

  return (
    <div>
      <PageHeader title="订单管理" subtitle={`共 ${data.length} 单`}
        action={<button onClick={() => navigate('/order/new')} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>+ 新建订单</button>}
      />
      <Card>
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>状态筛选：</span>
          <select
            style={{ padding: '0.3rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem' }}
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">全部</option>
            {allStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <Table columns={columns} data={data} loading={loading} emptyText="暂无订单数据" />
      </Card>
    </div>
  )
}
