import { useEffect, useState } from 'react'
import { PageHeader, Card, Table, Badge } from '@/components/Table'
import api, { ResultDTO, PageDTO } from '@/lib/api'

interface Role {
  id: number
  name: string
  code: string
  description: string | null
  status: number
  createdAt: string
}

const statusMap: Record<number, { label: string; variant: 'success' | 'danger' }> = {
  1: { label: '启用', variant: 'success' },
  0: { label: '禁用', variant: 'danger' },
}

export default function RolePage() {
  const [data, setData] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [keyword, setKeyword] = useState('')

  const [form, setForm] = useState({ name: '', code: '', description: '', status: 1 })
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = () => {
    setLoading(true)
    api.get<ResultDTO<PageDTO<Role>>>('/system/roles', { params: { keyword } })
      .then((r) => { if (r.data.code === 200) setData(r.data.data.records) })
      .catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [keyword])

  const openCreate = () => { setEditRole(null); setForm({ name: '', code: '', description: '', status: 1 }); setError(''); setShowForm(true) }
  const openEdit = (r: Role) => { setEditRole(r); setForm({ name: r.name, code: r.code, description: r.description || '', status: r.status }); setError(''); setShowForm(true) }

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.code) { setError('名称和编码不能为空'); return }
    setSaveLoading(true)
    try {
      const res = editRole
        ? await api.put(`/system/roles/${editRole.id}`, form)
        : await api.post('/system/roles', form)
      if (res.data.code === 200) { setShowForm(false); fetchData() }
      else setError(res.data.message || '操作失败')
    } catch (e: any) { setError(e.response?.data?.message || '网络错误') }
    finally { setSaveLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return
    await api.delete(`/system/roles/${id}`)
    fetchData()
  }

  const fieldStyle = { padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem', width: '100%' }

  return (
    <div>
      <PageHeader title="角色管理" action={<button onClick={openCreate} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>+ 新增角色</button>} />
      <Card>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
          <input className="input-field" style={{ maxWidth: '260px' }} placeholder="搜索名称/编码..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
        <Table
          columns={[
            { key: 'id', label: 'ID', width: '50px' },
            { key: 'name', label: '角色名称', width: '130px' },
            { key: 'code', label: '角色编码', width: '160px', render: (r: Role) => <code style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>{r.code}</code> },
            { key: 'description', label: '描述' },
            { key: 'status', label: '状态', width: '80px', render: (r: Role) => <Badge variant={statusMap[r.status]?.variant}>{statusMap[r.status]?.label || '未知'}</Badge> },
            { key: 'createdAt', label: '创建时间', width: '150px', render: (r: Role) => r.createdAt?.slice(0, 16).replace('T', ' ') },
            { key: '_actions', label: '操作', width: '130px', render: (r: Role) => (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEdit(r)} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: '1px solid #3b82f6', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>编辑</button>
                <button onClick={() => handleDelete(r.id)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>删除</button>
              </div>
            )},
          ]}
          data={data}
          loading={loading}
          emptyText="暂无角色数据"
        />
      </Card>

      {/* 弹窗 */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', width: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{editRole ? '编辑角色' : '新增角色'}</h3>
            {error && <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>{error}</div>}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>角色名称 *</label><input style={fieldStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>角色编码 *</label><input style={fieldStyle} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={!!editRole} /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>描述</label><input style={fieldStyle} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>状态</label>
                <select style={fieldStyle} value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
                  <option value={1}>启用</option>
                  <option value={0}>禁用</option>
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
