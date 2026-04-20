import { useEffect, useState } from 'react'
import { PageHeader, Card, Table, Badge } from '@/components/Table'
import api, { ResultDTO } from '@/lib/api'

interface Menu {
  id: number
  parentId: number
  name: string
  path: string
  component: string
  icon: string
  sortOrder: number
  type: number
  perms: string | null
  status: number
  createdAt: string
}

const typeMap: Record<number, string> = { 1: '菜单', 2: '按钮' }
const statusMap: Record<number, { label: string; variant: 'success' | 'danger' }> = {
  1: { label: '启用', variant: 'success' },
  0: { label: '禁用', variant: 'danger' },
}

export default function MenuPage() {
  const [data, setData] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editMenu, setEditMenu] = useState<Menu | null>(null)
  const [form, setForm] = useState({ name: '', path: '', component: '', icon: '', sortOrder: 0, type: 1, perms: '', status: 1 })
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = () => {
    setLoading(true)
    api.get<ResultDTO<Menu[]>>('/system/menus').then((r) => { if (r.data.code === 200) setData(r.data.data) })
      .catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditMenu(null); setForm({ name: '', path: '', component: '', icon: '', sortOrder: 0, type: 1, perms: '', status: 1 }); setError(''); setShowForm(true) }
  const openEdit = (m: Menu) => { setEditMenu(m); setForm({ name: m.name, path: m.path || '', component: m.component || '', icon: m.icon || '', sortOrder: m.sortOrder, type: m.type, perms: m.perms || '', status: m.status }); setError(''); setShowForm(true) }

  const handleSubmit = async () => {
    setError('')
    if (!form.name) { setError('菜单名称不能为空'); return }
    setSaveLoading(true)
    try {
      const payload = { ...form, parentId: 0 }
      const res = editMenu ? await api.put(`/system/menus/${editMenu.id}`, payload) : await api.post('/system/menus', payload)
      if (res.data.code === 200) { setShowForm(false); fetchData() }
      else setError(res.data.message || '操作失败')
    } catch (e: any) { setError(e.response?.data?.message || '网络错误') }
    finally { setSaveLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return
    await api.delete(`/system/menus/${id}`).catch((e) => alert(e.response?.data?.message || '删除失败'))
    fetchData()
  }

  const fieldStyle = { padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem', width: '100%' }

  return (
    <div>
      <PageHeader title="菜单管理" action={<button onClick={openCreate} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>+ 新增菜单</button>} />
      <Card>
        <Table
          columns={[
            { key: 'id', label: 'ID', width: '40px' },
            { key: 'name', label: '菜单名称', render: (m: Menu) => <span style={{ fontWeight: m.parentId === 0 ? 600 : 400 }}>{m.name}</span> },
            { key: 'path', label: '路由', render: (m: Menu) => m.path ? <code style={{ fontSize: '0.72rem' }}>{m.path}</code> : '-' },
            { key: 'component', label: '组件', render: (m: Menu) => m.component ? <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.component}</span> : '-' },
            { key: 'type', label: '类型', width: '70px', render: (m: Menu) => typeMap[m.type] || m.type },
            { key: 'perms', label: '权限', width: '150px', render: (m: Menu) => m.perms ? <code style={{ fontSize: '0.72rem' }}>{m.perms}</code> : '-' },
            { key: 'status', label: '状态', width: '70px', render: (m: Menu) => <Badge variant={statusMap[m.status]?.variant}>{statusMap[m.status]?.label}</Badge> },
            { key: 'sortOrder', label: '排序', width: '60px' },
            { key: '_actions', label: '操作', width: '130px', render: (m: Menu) => (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEdit(m)} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: '1px solid #3b82f6', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>编辑</button>
                <button onClick={() => handleDelete(m.id)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>删除</button>
              </div>
            )},
          ]}
          data={data}
          loading={loading}
          emptyText="暂无菜单数据"
        />
      </Card>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', width: '440px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{editMenu ? '编辑菜单' : '新增菜单'}</h3>
            {error && <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>{error}</div>}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>菜单名称 *</label><input style={fieldStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>类型</label>
                  <select style={fieldStyle} value={form.type} onChange={(e) => setForm({ ...form, type: Number(e.target.value) })}>
                    <option value={1}>菜单</option><option value={2}>按钮</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>路由路径</label><input style={fieldStyle} value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="如: /system/roles" /></div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>排序</label><input type="number" style={fieldStyle} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
              </div>
              <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>组件路径</label><input style={fieldStyle} value={form.component} onChange={(e) => setForm({ ...form, component: e.target.value })} placeholder="如: @/pages/system/RolePage" /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', display: 'block' }}>权限标识</label><input style={fieldStyle} value={form.perms} onChange={(e) => setForm({ ...form, perms: e.target.value })} placeholder="如: system:role:create" /></div>
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
