import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api, { ResultDTO } from '@/lib/api'
import { Badge } from '@/components/Table'

interface OrderItem {
  id: number; skuName: string; skuCode: string; quantity: number; unitPrice: number
}
interface StatusLog {
  id: number; status: number; statusName: string; operateBy: string | null
  operatorName: string | null; operateTime: string; remark: string | null
}
interface OrderDetail {
  id: number; orderNo: string; senderName: string; senderPhone: string
  senderAddress: string; receiverName: string; receiverPhone: string
  receiverAddress: string; totalAmount: number; weightKg: number; volumeCbm: number
  status: number; statusName: string; remark: string | null; createdAt: string
  items: OrderItem[]; logs: StatusLog[]
}

// 状态名称与后端 OrderService.getStatusName() 完全一致
const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  10: { label: '待确认',   color: '#f59e0b', bg: '#fffbeb' },
  20: { label: '已确认',   color: '#3b82f6', bg: '#eff6ff' },
  30: { label: '已入库',   color: '#8b5cf6', bg: '#f5f3ff' },
  40: { label: '已发货',   color: '#06b6d4', bg: '#f0fdfa' },
  50: { label: '运输中',   color: '#6366f1', bg: '#eef2ff' },
  60: { label: '已送达',   color: '#10b981', bg: '#ecfdf5' },
  70: { label: '已完成',   color: '#059669', bg: '#ecfdf5' },
  80: { label: '已取消',   color: '#ef4444', bg: '#fef2f2' },
}

// 每个状态可转换到哪些状态，以及对应的按钮配置
type Transition = { next: number; label: string; color: string; bg: string }
const transitions: Record<number, Transition> = {
  10: { next: 20, label: '✅ 确认订单',   color: '#3b82f6', bg: '#eff6ff' },
  20: { next: 30, label: '📥 确认入库',   color: '#8b5cf6', bg: '#f5f3ff' },
  30: { next: 40, label: '🚚 确认发货',   color: '#06b6d4', bg: '#f0fdfa' },
  40: { next: 50, label: '🚛 开始运输',   color: '#6366f1', bg: '#eef2ff' },
  50: { next: 60, label: '🏁 确认到达',   color: '#10b981', bg: '#ecfdf5' },
  60: { next: 70, label: '✔️ 完成订单',   color: '#059669', bg: '#ecfdf5' },
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchOrder = () => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.get<ResultDTO<OrderDetail>>(`/order/orders/${id}`),
      api.get<ResultDTO<StatusLog[]>>(`/order/orders/${id}/logs`),
    ]).then(([orderRes, logsRes]) => {
      if (orderRes.data.code === 200) {
        setOrder({ ...orderRes.data.data, logs: logsRes.data.code === 200 ? logsRes.data.data : [] })
      }
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrder() }, [id])

  const advance = async (newStatus: number, label: string) => {
    if (!confirm(`确定「${label}」？`)) return
    setActionLoading(true)
    setMsg(null)
    try {
      const res = await api.put(`/order/orders/${id}/status`, { status: newStatus })
      if (res.data.code === 200) {
        setMsg({ type: 'ok', text: `已更新为「${label}」` })
        fetchOrder()
      } else {
        setMsg({ type: 'err', text: res.data.message || '操作失败' })
      }
    } catch (e: any) {
      setMsg({ type: 'err', text: e.response?.data?.message || '网络错误' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div style={{ color: '#64748b', padding: '2rem' }}>加载中...</div>
  if (!order) return <div style={{ color: '#64748b', padding: '2rem' }}>订单不存在</div>

  const status = statusMap[order.status] || { label: order.statusName, color: '#64748b', bg: '#f1f5f9' }
  const nextAction = transitions[order.status]
  const infoCardStyle = { backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
  const labelStyle = { fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }
  const valueStyle = { fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }
  const colStyle = { padding: '0.625rem 1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }
  const thStyle = { ...colStyle, backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', textAlign: 'left' as const }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/order')} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>←</button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>订单详情</h1>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{order.orderNo}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {nextAction && (
            <button
              onClick={() => advance(nextAction.next, nextAction.label)}
              disabled={actionLoading}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: '0.5rem',
                border: `1px solid ${nextAction.color}`,
                backgroundColor: nextAction.bg,
                color: nextAction.color,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              {actionLoading ? '处理中...' : nextAction.label}
            </button>
          )}
          <span style={{ padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', backgroundColor: msg.type === 'ok' ? '#ecfdf5' : '#fef2f2', color: msg.type === 'ok' ? '#059669' : '#dc2626' }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={infoCardStyle}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid #3b82f6' }}>发货信息</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><div style={labelStyle}>发货人</div><div style={valueStyle}>{order.senderName}</div></div>
            <div><div style={labelStyle}>联系电话</div><div style={valueStyle}>{order.senderPhone || '-'}</div></div>
            <div style={{ gridColumn: '1/-1' }}><div style={labelStyle}>发货地址</div><div style={valueStyle}>{order.senderAddress || '-'}</div></div>
          </div>
        </div>
        <div style={infoCardStyle}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid #10b981' }}>收货信息</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><div style={labelStyle}>收货人</div><div style={valueStyle}>{order.receiverName}</div></div>
            <div><div style={labelStyle}>联系电话</div><div style={valueStyle}>{order.receiverPhone || '-'}</div></div>
            <div style={{ gridColumn: '1/-1' }}><div style={labelStyle}>收货地址</div><div style={valueStyle}>{order.receiverAddress || '-'}</div></div>
          </div>
        </div>
      </div>

      <div style={infoCardStyle}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>订单信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <div><div style={labelStyle}>订单编号</div><div style={{ ...valueStyle, fontSize: '0.8rem' }}>{order.orderNo}</div></div>
          <div><div style={labelStyle}>订单金额</div><div style={{ ...valueStyle, color: '#ef4444', fontWeight: 700 }}>¥{order.totalAmount.toFixed(2)}</div></div>
          <div><div style={labelStyle}>总重量</div><div style={valueStyle}>{order.weightKg > 0 ? `${order.weightKg} kg` : '-'}</div></div>
          <div><div style={labelStyle}>总体积</div><div style={valueStyle}>{order.volumeCbm > 0 ? `${order.volumeCbm} m³` : '-'}</div></div>
        </div>
        {order.remark && <div style={{ marginTop: '0.75rem' }}><div style={labelStyle}>备注</div><div style={valueStyle}>{order.remark}</div></div>}
      </div>

      <div style={{ ...infoCardStyle, marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>商品明细</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead><tr>
            <th style={thStyle}>商品名称</th><th style={thStyle}>SKU</th>
            <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>数量</th>
            <th style={{ ...thStyle, width: '100px', textAlign: 'right' }}>单价</th>
            <th style={{ ...thStyle, width: '100px', textAlign: 'right' }}>小计</th>
          </tr></thead>
          <tbody>{order.items.map((item) => (
            <tr key={item.id}>
              <td style={colStyle}>{item.skuName}</td><td style={colStyle}>{item.skuCode}</td>
              <td style={{ ...colStyle, textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ ...colStyle, textAlign: 'right' }}>¥{item.unitPrice.toFixed(2)}</td>
              <td style={{ ...colStyle, textAlign: 'right', fontWeight: 600 }}>¥{(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div style={{ ...infoCardStyle, marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>状态变更日志</h3>
        {order.logs.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>暂无日志</div>
         : order.logs.slice().reverse().map((log) => {
           const s = statusMap[log.status] || { label: log.statusName, color: '#64748b', bg: '#f1f5f9' }
           return (
             <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
               <div style={{ flex: 1 }}>
                 <span style={{ fontSize: '0.875rem', fontWeight: 600, color: s.color }}>{log.statusName}</span>
                 {log.remark && <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>{log.remark}</span>}
               </div>
               <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.operateTime?.slice(0, 16).replace('T', ' ')} {log.operatorName || log.operateBy || ''}</div>
             </div>
           )
         })}
      </div>
    </div>
  )
}
