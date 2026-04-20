import { useEffect, useState } from 'react'
import { PageHeader, Card, Table } from '@/components/Table'
import api, { ResultDTO } from '@/lib/api'

interface Dept {
  id: number
  parentId: number
  name: string
  sortOrder: number
  createdAt: string
}

export default function DeptPage() {
  const [data, setData] = useState<Dept[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editDept, setEditDept] = useState<Dept | null>(null)
  const [form, setForm] = useState({ name: '', parentId: 0, sortOrder: 0 })
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = () => {
    setLoading(true)
    api.get<ResultDTO<Dept[]>>('/system/depts').then((r) => { if (r.data.code === 200) setData(r.data.data) })
      .catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditDept(null); setForm({ name: '', parentId: 0, sortOrder: 0 }); setError(''); setShowForm(true) }
  const openEdit = (d: Dept) => { setEditDept(d); setForm({ name: d.name, parentId: d.parentId, sortOrder: d.sortOrder }); setError(''); setShowForm(true) }

  const handleSubmit = async () => {
    setError('')
    if (!form.name) { setError('部门名称不能为空'); return }
    setSaveLoading(true)
    try {
      const res = editDept ? await api.put(`/system/depts/${editDept.id}`, form) : await api.post('/system/depts', form)
      if (res.data.code === 200) { setShowForm(false); fetchData() }
      else setError(res.data.message || '操作失败')
    } catch (e: any) { setError(e.response?.data?.message || '网络错误') }
    finally { setSaveLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return
    await api.delete(`/system/depts/${id}`).catch((e) => alert(e.response?.data?.message || '删除失败'))
    fetchData()
  }

  const fieldStyle = { padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem', width: '100%' }

  return (
    <div>
      <PageHeader title="部门管理" action={<button onClick={openCreate} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>+ 新增部门</button>} />
      <Card>
        <Table
          columns={[
            { key: 'id', label: 'ID', width: '50px' },
            { key: 'name', label: '部门名称', render: (d: Dept) => d.parentId === 0 ? <b>{d.name}</b> : <span style={{ marginLeft: '1.5rem', color: '#475569' }}>{d.name}</span> },
            { key: 'sortOrder', label: '排序', width: '80px' },
            { key: 'createdAt', label: '创建时间', width: '150px', render: (d: Dept) => d.createdAt?.slice(0, 16).replace('T', ' ') },
            { key: '_actions', label: '操作', width: '130px', render: (d: Dept) => (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEdit(d)} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: '1px solid #3b82f6', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>编辑</button>
                <button onClick={() => handleDelete(d.id)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>删除</button>
              </div>
            )},
          ]}
          data={data}
          loading={loading}
          emptyText="暂无部门数据"
        />
      </Card>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{editDept ? '编辑部门' : '新增部门'}</h3>
            {error && <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>{error}</div>}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>部门名称 *</label><input style={fieldStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>排序</label><input type="number" style={fieldStyle} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
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
