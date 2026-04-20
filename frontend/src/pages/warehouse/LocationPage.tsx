import { useEffect, useState } from 'react'
import { PageHeader, Card, Table, Badge } from '@/components/Table'
import api, { ResultDTO, PageDTO } from '@/lib/api'

interface Location {
  id: number
  warehouseId: number
  warehouseName?: string
  zoneId: number | null
  code: string
  type: string
  shelfLayer: number | null
  capacity: number | null
  usedCapacity: number | null
  status: number
  createdAt: string
}

interface Warehouse {
  id: number
  name: string
}

const typeMap: Record<string, { label: string; color: string }> = {
  SHELF: { label: '货架', color: '#3b82f6' },
  FLOOR: { label: '地面', color: '#10b981' },
}

export default function LocationPage() {
  const [data, setData] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouseId, setWarehouseId] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editLoc, setEditLoc] = useState<Location | null>(null)
  const [form, setForm] = useState({ warehouseId: '', code: '', type: 'SHELF', shelfLayer: 1, capacity: '' })
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchLocations = () => {
    setLoading(true)
    api.get<ResultDTO<PageDTO<Location>>>('/warehouse/locations', {
      params: { warehouseId: warehouseId || undefined, keyword: keyword || undefined }
    }).then((r) => { if (r.data.code === 200) setData(r.data.data.records) })
      .catch(console.error).finally(() => setLoading(false))
  }

  const fetchWarehouses = () => {
    api.get<ResultDTO<{ records: Warehouse[] }>>('/warehouse/warehouses').then((r) => {
      if (r.data.code === 200) setWarehouses(r.data.data?.records || [])
    }).catch(() => setWarehouses([]))
  }

  useEffect(() => { fetchWarehouses() }, [])

  useEffect(() => { fetchLocations() }, [warehouseId, keyword])

  const openCreate = () => {
    setEditLoc(null)
    setForm({ warehouseId: warehouseId || String(warehouses[0]?.id || ''), code: '', type: 'SHELF', shelfLayer: 1, capacity: '' })
    setError(''); setShowForm(true)
  }

  const openEdit = (loc: Location) => {
    setEditLoc(loc)
    setForm({ warehouseId: String(loc.warehouseId), code: loc.code, type: loc.type, shelfLayer: loc.shelfLayer || 1, capacity: loc.capacity ? String(loc.capacity) : '' })
    setError(''); setShowForm(true)
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.warehouseId || !form.code) { setError('仓库和编码不能为空'); return }
    setSaveLoading(true)
    try {
      const payload = { warehouseId: Number(form.warehouseId), code: form.code, type: form.type, shelfLayer: Number(form.shelfLayer), capacity: form.capacity ? Number(form.capacity) : null }
      const res = editLoc
        ? await api.put(`/warehouse/locations/${editLoc.id}`, payload)
        : await api.post('/warehouse/locations', payload)
      if (res.data.code === 200) { setShowForm(false); fetchLocations() }
      else setError(res.data.message || '操作失败')
    } catch (e: any) { setError(e.response?.data?.message || '网络错误') }
    finally { setSaveLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该库位？')) return
    await api.delete(`/warehouse/locations/${id}`).catch((e) => alert(e.response?.data?.message || '删除失败'))
    fetchLocations()
  }

  const usagePct = (loc: Location) => {
    if (!loc.capacity || loc.capacity <= 0) return 0
    return Math.round((loc.usedCapacity || 0) / loc.capacity * 100)
  }

  const fieldStyle = { padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem', width: '100%' }

  const columns = [
    { key: 'id', label: 'ID', width: '50px' },
    { key: 'code', label: '库位编码', width: '100px', render: (r: Location) => <code style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.code}</code> },
    { key: 'type', label: '类型', width: '80px', render: (r: Location) => <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', backgroundColor: typeMap[r.type]?.color + '20', color: typeMap[r.type]?.color }}>{typeMap[r.type]?.label || r.type}</span> },
    { key: 'shelfLayer', label: '层', width: '50px', render: (r: Location) => r.shelfLayer ? `第${r.shelfLayer}层` : '-' },
    { key: 'capacity', label: '容量', width: '90px', render: (r: Location) => r.capacity ? `${r.capacity}m³` : '-' },
    { key: 'used', label: '使用率', width: '120px', render: (r: Location) => {
      const pct = usagePct(r)
      const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981'
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ flex: 1, height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', minWidth: '50px' }}>
            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '3px' }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b', minWidth: '32px' }}>{pct}%</span>
        </div>
      )
    }},
    { key: 'status', label: '状态', width: '70px', render: (r: Location) => <Badge variant={r.status === 1 ? 'success' : 'danger'}>{r.status === 1 ? '启用' : '停用'}</Badge> },
    { key: '_actions', label: '操作', width: '110px', render: (r: Location) => (
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        <button onClick={() => openEdit(r)} style={{ fontSize: '0.72rem', color: '#3b82f6', background: 'none', border: '1px solid #3b82f6', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', cursor: 'pointer' }}>编辑</button>
        <button onClick={() => handleDelete(r.id)} style={{ fontSize: '0.72rem', color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', cursor: 'pointer' }}>删除</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="库位管理"
        subtitle="仓库库位配置与容量监控"
        action={<button onClick={openCreate} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>+ 新增库位</button>}
      />
      <Card>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem' }}>
          <select style={{ ...fieldStyle, maxWidth: '200px' }} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            <option value="">全部仓库</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input className="input-field" style={{ maxWidth: '220px' }} placeholder="搜索库位编码..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
        <Table columns={columns} data={data} loading={loading} emptyText="暂无库位数据" />
      </Card>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', width: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{editLoc ? '编辑库位' : '新增库位'}</h3>
            {error && <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>{error}</div>}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>所属仓库 *</label>
                  <select style={fieldStyle} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>库位编码 *</label>
                  <input style={fieldStyle} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如: A-01-001" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>类型</label>
                  <select style={fieldStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="SHELF">货架</option><option value="FLOOR">地面</option>
                  </select>
                </div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>层</label>
                  <input type="number" style={fieldStyle} value={form.shelfLayer} min={1} max={5} onChange={(e) => setForm({ ...form, shelfLayer: Number(e.target.value) })} />
                </div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>容量(m³)</label>
                  <input type="number" style={fieldStyle} value={form.capacity} placeholder="100" onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
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
