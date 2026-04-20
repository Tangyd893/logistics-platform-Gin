import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'

interface OrderItem {
  skuName: string
  skuCode: string
  quantity: number
  unitPrice: number
}

export default function OrderCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    remark: '',
  })
  const [items, setItems] = useState<OrderItem[]>([{ skuName: '', skuCode: '', quantity: 1, unitPrice: 0 }])

  const updateItem = (idx: number, field: keyof OrderItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const addItem = () => setItems((prev) => [...prev, { skuName: '', skuCode: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.senderName || !form.receiverName) {
      setError('请填写发收货人信息')
      return
    }
    if (items.every((i) => !i.skuName)) {
      setError('请至少添加一个商品')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/order/orders', {
        ...form,
        items: items.filter((i) => i.skuName),
      })
      if (res.data.code === 200) {
        navigate('/order')
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
        <button onClick={() => navigate('/order')} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>创建订单</h1>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* 发货人 */}
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid #3b82f6', display: 'inline-block' }}>发货信息</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>发货人姓名 *</label>
                  <input style={fieldStyle} value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} placeholder="发货人姓名" required />
                </div>
                <div>
                  <label style={labelStyle}>发货电话</label>
                  <input style={fieldStyle} value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} placeholder="手机号" />
                </div>
                <div>
                  <label style={labelStyle}>发货地址</label>
                  <input style={fieldStyle} value={form.senderAddress} onChange={(e) => setForm({ ...form, senderAddress: e.target.value })} placeholder="详细地址" />
                </div>
              </div>
            </div>

            {/* 收货人 */}
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid #10b981', display: 'inline-block' }}>收货信息</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>收货人姓名 *</label>
                  <input style={fieldStyle} value={form.receiverName} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} placeholder="收货人姓名" required />
                </div>
                <div>
                  <label style={labelStyle}>收货电话</label>
                  <input style={fieldStyle} value={form.receiverPhone} onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })} placeholder="手机号" />
                </div>
                <div>
                  <label style={labelStyle}>收货地址</label>
                  <input style={fieldStyle} value={form.receiverAddress} onChange={(e) => setForm({ ...form, receiverAddress: e.target.value })} placeholder="详细地址" />
                </div>
              </div>
            </div>
          </div>

          {/* 商品明细 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>商品明细</h3>
              <button type="button" onClick={addItem} style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', backgroundColor: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>+ 添加商品</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>商品名称</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '120px' }}>SKU</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '80px' }}>数量</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '100px' }}>单价(元)</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '100px' }}>小计</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '0.25rem', borderBottom: '1px solid #f1f5f9' }}>
                      <input style={{ ...fieldStyle, padding: '0.375rem 0.5rem' }} value={item.skuName} onChange={(e) => updateItem(idx, 'skuName', e.target.value)} placeholder="商品名称" />
                    </td>
                    <td style={{ padding: '0.25rem', borderBottom: '1px solid #f1f5f9' }}>
                      <input style={{ ...fieldStyle, padding: '0.375rem 0.5rem' }} value={item.skuCode} onChange={(e) => updateItem(idx, 'skuCode', e.target.value)} placeholder="SKU" />
                    </td>
                    <td style={{ padding: '0.25rem', borderBottom: '1px solid #f1f5f9' }}>
                      <input style={{ ...fieldStyle, padding: '0.375rem 0.5rem', textAlign: 'center' }} type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '0.25rem', borderBottom: '1px solid #f1f5f9' }}>
                      <input style={{ ...fieldStyle, padding: '0.375rem 0.5rem', textAlign: 'right' }} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '0.375rem 0.5rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#1e293b', fontWeight: 500 }}>
                      ¥{(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.25rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>×</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: '0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
              合计金额：<span style={{ color: '#ef4444', fontSize: '1.25rem' }}>¥{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* 备注 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>备注</label>
            <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: '60px' }} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="可选备注信息" />
          </div>

          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate('/order')} style={{ padding: '0.5rem 1.25rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>取消</button>
            <button type="submit" disabled={loading} style={{ padding: '0.5rem 1.25rem', backgroundColor: loading ? '#93c5fd' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
              {loading ? '提交中...' : '创建订单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
