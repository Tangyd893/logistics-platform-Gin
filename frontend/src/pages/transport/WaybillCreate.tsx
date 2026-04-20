import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { ResultDTO } from '@/lib/api'

interface Driver {
  id: number
  name: string
  phone: string
  status: number
  warehouseName: string | null
}

interface Vehicle {
  id: number
  plateNo: string
  type: string
  capacityKg: number
  status: number
}

interface Order {
  id: number
  orderNo: string
  senderName: string
  senderPhone: string
  senderAddress: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
}

interface Warehouse {
  id: number
  name: string
}

export default function WaybillCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const [form, setForm] = useState({
    orderId: '',
    warehouseId: '',
    driverId: '',
    vehicleId: '',
    fromAddress: '',
    toAddress: '',
    remark: '',
  })

  // 加载仓库、司机、车辆、待分配订单
  useEffect(() => {
    Promise.all([
      api.get<ResultDTO<{ records: Warehouse[] }>>('/warehouse/warehouses'),
      api.get<ResultDTO<Driver[]>>('/transport/drivers'),
      api.get<ResultDTO<Vehicle[]>>('/transport/vehicles'),
      api.get<ResultDTO<{ records: Order[] }>>('/order/orders?status=40'),
    ]).then(([warehouseRes, driverRes, vehicleRes, orderRes]) => {
      if (warehouseRes.data.code === 200) setWarehouses(warehouseRes.data.data?.records || [])
      if (driverRes.data.code === 200) setDrivers(driverRes.data.data.filter((d: Driver) => d.status === 1))
      if (vehicleRes.data.code === 200) setVehicles(vehicleRes.data.data.filter((v: Vehicle) => v.status === 1))
      if (orderRes.data.code === 200) setOrders(orderRes.data.data.records || [])
    }).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.orderId || !form.driverId || !form.vehicleId) {
      setError('请填写必填项')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/transport/waybills', {
        orderId: Number(form.orderId),
        warehouseId: Number(form.warehouseId),
        driverId: Number(form.driverId),
        vehicleId: Number(form.vehicleId),
        fromAddress: form.fromAddress,
        toAddress: form.toAddress,
      })
      if (res.data.code === 200) {
        navigate('/transport')
      } else {
        setError(res.data.message || '创建失败')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = { padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', width: '100%', outline: 'none' }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/transport')} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>创建运单</h1>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* 仓库（自动填充-fromAddress 的归属仓库） */}
            <div>
              <label style={labelStyle}>仓库 *</label>
              <select
                style={fieldStyle}
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
              >
                <option value="">请选择仓库</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            {/* 关联订单 */}
            <div>
              <label style={labelStyle}>关联订单 *</label>
              <select
                style={fieldStyle}
                value={form.orderId}
                onChange={(e) => {
                  const order = orders.find((o) => String(o.id) === e.target.value)
                  setForm({
                    ...form,
                    orderId: e.target.value,
                    fromAddress: order?.senderAddress || '',
                    toAddress: order?.receiverAddress || '',
                  })
                }}
              >
                <option value="">请选择订单</option>
                {orders.map((o) => <option key={o.id} value={o.id}>{o.orderNo} - {o.senderName} → {o.receiverName}</option>)}
              </select>
              {orders.length === 0 && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>暂无可用订单（状态需为「已发货」）</div>}
            </div>

            {/* 分配司机 */}
            <div>
              <label style={labelStyle}>分配司机 *</label>
              <select style={fieldStyle} value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                <option value="">请选择司机</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} - {d.phone} ({d.warehouseName || '自由司机'})</option>)}
              </select>
            </div>

            {/* 分配车辆 */}
            <div>
              <label style={labelStyle}>分配车辆 *</label>
              <select style={fieldStyle} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">请选择车辆</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNo} - {v.type} (载重{v.capacityKg}kg)</option>)}
              </select>
            </div>
          </div>

          {/* 运输路线（自动填充，支持修改） */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={labelStyle}>发货地址</label>
              <input style={fieldStyle} value={form.fromAddress} onChange={(e) => setForm({ ...form, fromAddress: e.target.value })} placeholder="发货地址（选订单后自动填充）" />
            </div>
            <div>
              <label style={labelStyle}>收货地址</label>
              <input style={fieldStyle} value={form.toAddress} onChange={(e) => setForm({ ...form, toAddress: e.target.value })} placeholder="收货地址（选订单后自动填充）" />
            </div>
          </div>

          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate('/transport')} style={{ padding: '0.5rem 1.25rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>取消</button>
            <button type="submit" disabled={loading} style={{ padding: '0.5rem 1.25rem', backgroundColor: loading ? '#93c5fd' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
              {loading ? '提交中...' : '创建运单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
