import { useEffect, useState } from 'react'
import { PageHeader, Card, Table, Badge } from '@/components/Table'
import api, { ResultDTO } from '@/lib/api'

interface Vehicle {
  id: number; plateNo: string; type: string
  capacityKg: number; capacityCbm: number; status: number; createdAt: string
}

const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  1: { label: '空闲', variant: 'success' },
  2: { label: '运输中', variant: 'warning' },
  0: { label: '维修中', variant: 'danger' },
}

const emptyForm = { plateNo: '', type: '', capacityKg: '', capacityCbm: '', status: 1 }
type VehicleForm = typeof emptyForm

const VEHICLE_TYPES = ['厢式货车', '敞篷货车', '冷藏车', '集装箱', '平板车', '其他']

export default function VehiclePage() {
  const [data, setData] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [form, setForm] = useState<VehicleForm>(emptyForm)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const fetchData = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    api.get<ResultDTO<Vehicle[]>>('/transport/vehicles', { params }).then((res) => {
      if (res.data.code === 200) setData(res.data.data)
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [statusFilter])

  const openCreate = () => { setEditVehicle(null); setForm(emptyForm); setError(''); setShowForm(true) }
  const openEdit = (v: Vehicle) => {
    setEditVehicle(v)
    setForm({ plateNo: v.plateNo, type: v.type, capacityKg: String(v.capacityKg), capacityCbm: String(v.capacityCbm), status: v.status })
    setError(''); setShowForm(true)
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.plateNo || !form.type) { setError('车牌号和车型不能为空'); return }
    setSaveLoading(true)
    try {
      const payload = { plateNo: form.plateNo, type: form.type, capacityKg: Number(form.capacityKg), capacityCbm: Number(form.capacityCbm), status: form.status }
      const res = editVehicle ? await api.put(`/transport/vehicles/${editVehicle.id}`, payload) : await api.post('/transport/vehicles', payload)
      if (res.data.code === 200) { setShowForm(false); fetchData() }
      else setError(res.data.message || '操作失败')
    } catch (e: any) { setError(e.response?.data?.message || '网络错误') }
    finally { setSaveLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该车辆？')) return
    await api.delete(`/transport/vehicles/${id}`).catch((e) => alert(e.response?.data?.message || '删除失败'))
    fetchData()
  }

  const fieldStyle = { padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem', width: '100%' }

  const columns = [
    { key: 'id', label: 'ID', width: '50px' },
    { key: 'plateNo', label: '车牌号', width: '110px', render: (v: Vehicle) => <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem' }}>{v.plateNo}</span> },
    { key: 'type', label: '车型', width: '110px', render: (v: Vehicle) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{v.type}</span> },
    { key: 'capacityKg', label: '载重(kg)', width: '100px', render: (v: Vehicle) => v.capacityKg.toLocaleString() },
    { key: 'capacityCbm', label: '容积(m³)', width: '100px', render: (v: Vehicle) => v.capacityCbm.toFixed(1) },
    { key: 'status', label: '状态', width: '80px', render: (v: Vehicle) => <Badge variant={statusMap[v.status]?.variant}>{statusMap[v.status]?.label}</Badge> },
    { key: 'createdAt', label: '创建时间', width: '150px', render: (v: Vehicle) => v.createdAt?.slice(0, 16).replace('T', ' ') },
    { key: '_actions', label: '操作', width: '110px', render: (v: Vehicle) => (
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        <button onClick={() => openEdit(v)} style={{ fontSize: '0.72rem', color: '#3b82f6', background: 'none', border: '1px solid #3b82f6', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', cursor: 'pointer' }}>编辑</button>
        <button onClick={() => handleDelete(v.id)} style={{ fontSize: '0.72rem', color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', cursor: 'pointer' }}>删除</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="车辆管理" subtitle={`共 ${data.length} 辆`}
        action={<button onClick={openCreate} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>+ 新增车辆</button>}
      />
      <Card>
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>状态：</span>
          <select style={{ padding: '0.3rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">全部</option>
            <option value="1">空闲</option><option value="2">运输中</option><option value="0">维修中</option>
          </select>
        </div>
        <Table columns={columns} data={data} loading={loading} emptyText="暂无车辆数据" />
      </Card>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{editVehicle ? '编辑车辆' : '新增车辆'}</h3>
            {error && <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>{error}</div>}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>车牌号 *</label><input style={fieldStyle} value={form.plateNo} onChange={(e) => setForm({ ...form, plateNo: e.target.value })} placeholder="如: 京A12345" /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>车型 *</label>
                  <select style={fieldStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="">请选择</option>
                    {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>载重(kg)</label><input type="number" style={fieldStyle} value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: e.target.value })} placeholder="5000" /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>容积(m³)</label><input type="number" step="0.1" style={fieldStyle} value={form.capacityCbm} onChange={(e) => setForm({ ...form, capacityCbm: e.target.value })} placeholder="20" /></div>
              </div>
              <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>状态</label>
                <select style={fieldStyle} value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
                  <option value={1}>空闲</option><option value={2}>运输中</option><option value={0}>维修中</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '0.4rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>取消</button>
              <button onClick={handleSubmit} disabled={saveLoading} style={{ padding: '0.4rem 1rem', backgroundColor: saveLoading ? '#93c5fd' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: saveLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>{saveLoading ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
