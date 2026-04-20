import { useEffect, useState } from 'react'
import { PageHeader, Card, Table, Badge } from '@/components/Table'
import api, { ResultDTO } from '@/lib/api'

interface Driver {
  id: number; name: string; phone: string; licenseNo: string
  idCard: string | null; status: number
  warehouseId: number | null; warehouseName: string | null
  createdAt: string
}

interface Warehouse { id: number; name: string }

const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  1: { label: '空闲', variant: 'success' },
  2: { label: '运输中', variant: 'warning' },
  0: { label: '禁用', variant: 'danger' },
}

const emptyForm = { name: '', phone: '', licenseNo: '', idCard: '', warehouseId: '', status: 1 }
type DriverForm = typeof emptyForm

export default function DriverPage() {
  const [data, setData] = useState<Driver[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const [form, setForm] = useState<DriverForm>(emptyForm)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const fetchData = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    api.get<ResultDTO<Driver[]>>('/transport/drivers', { params }).then((res) => {
      if (res.data.code === 200) setData(res.data.data)
    }).catch(console.error).finally(() => setLoading(false))
  }

  const fetchWarehouses = () => {
    api.get<ResultDTO<{ records: Warehouse[] }>>('/warehouse/warehouses').then((r) => {
      if (r.data.code === 200) setWarehouses(r.data.data?.records || [])
    }).catch(() => setWarehouses([]))
  }

  useEffect(() => { fetchWarehouses() }, [])
  useEffect(() => { fetchData() }, [statusFilter])

  const openCreate = () => { setEditDriver(null); setForm(emptyForm); setError(''); setShowForm(true) }
  const openEdit = (d: Driver) => {
    setEditDriver(d)
    setForm({ name: d.name, phone: d.phone, licenseNo: d.licenseNo, idCard: d.idCard || '', warehouseId: String(d.warehouseId || ''), status: d.status })
    setError(''); setShowForm(true)
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.phone) { setError('姓名和电话不能为空'); return }
    setSaveLoading(true)
    try {
      const payload = { name: form.name, phone: form.phone, licenseNo: form.licenseNo, idCard: form.idCard || null, warehouseId: form.warehouseId ? Number(form.warehouseId) : null, status: form.status }
      const res = editDriver ? await api.put(`/transport/drivers/${editDriver.id}`, payload) : await api.post('/transport/drivers', payload)
      if (res.data.code === 200) { setShowForm(false); fetchData() }
      else setError(res.data.message || '操作失败')
    } catch (e: any) { setError(e.response?.data?.message || '网络错误') }
    finally { setSaveLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该司机？')) return
    await api.delete(`/transport/drivers/${id}`).catch((e) => alert(e.response?.data?.message || '删除失败'))
    fetchData()
  }

  const fieldStyle = { padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem', width: '100%' }

  const columns = [
    { key: 'id', label: 'ID', width: '50px' },
    { key: 'name', label: '姓名', width: '90px', render: (d: Driver) => <span style={{ fontWeight: 600 }}>{d.name}</span> },
    { key: 'phone', label: '联系电话', width: '130px' },
    { key: 'licenseNo', label: '驾驶证号', width: '180px', render: (d: Driver) => <code style={{ fontSize: '0.75rem' }}>{d.licenseNo}</code> },
    { key: 'warehouseName', label: '所属仓库', width: '130px', render: (d: Driver) => d.warehouseName || '-' },
    { key: 'status', label: '状态', width: '80px', render: (d: Driver) => <Badge variant={statusMap[d.status]?.variant}>{statusMap[d.status]?.label}</Badge> },
    { key: 'createdAt', label: '创建时间', width: '150px', render: (d: Driver) => d.createdAt?.slice(0, 16).replace('T', ' ') },
    { key: '_actions', label: '操作', width: '110px', render: (d: Driver) => (
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        <button onClick={() => openEdit(d)} style={{ fontSize: '0.72rem', color: '#3b82f6', background: 'none', border: '1px solid #3b82f6', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', cursor: 'pointer' }}>编辑</button>
        <button onClick={() => handleDelete(d.id)} style={{ fontSize: '0.72rem', color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', cursor: 'pointer' }}>删除</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="司机管理" subtitle={`共 ${data.length} 名司机`}
        action={<button onClick={openCreate} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>+ 新增司机</button>}
      />
      <Card>
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>状态：</span>
          <select style={{ padding: '0.3rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">全部</option>
            <option value="1">空闲</option><option value="2">运输中</option><option value="0">禁用</option>
          </select>
        </div>
        <Table columns={columns} data={data} loading={loading} emptyText="暂无司机数据" />
      </Card>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', width: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{editDriver ? '编辑司机' : '新增司机'}</h3>
            {error && <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>{error}</div>}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>姓名 *</label><input style={fieldStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>联系电话 *</label><input style={fieldStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>驾驶证号</label><input style={fieldStyle} value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>身份证号</label><input style={fieldStyle} value={form.idCard} onChange={(e) => setForm({ ...form, idCard: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>所属仓库</label>
                  <select style={fieldStyle} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
                    <option value="">无归属</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>状态</label>
                  <select style={fieldStyle} value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
                    <option value={1}>空闲</option><option value={2}>运输中</option><option value={0}>禁用</option>
                  </select>
                </div>
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
