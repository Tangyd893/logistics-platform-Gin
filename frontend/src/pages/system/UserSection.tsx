import { useEffect, useState } from 'react'
import { PageHeader, Card, Table, Badge } from '@/components/Table'
import api, { ResultDTO, PageDTO } from '@/lib/api'

interface SysUser {
  id: number
  username: string
  displayName: string
  phone: string
  email: string
  deptId: number
  deptName: string | null
  warehouseId: number | null
  warehouseName: string | null
  roleCode: string
  status: number
  statusName: string
}

const roleLabels: Record<string, string> = {
  ADMIN: '管理员',
  WAREHOUSE_ADMIN: '仓库经理',
  WAREHOUSE_OPERATOR: '仓库操作员',
  DISPATCHER: '调度员',
  TRANSPORT_DISPATCHER: '运输调度员',
}

const statusMap: Record<number, { label: string; variant: 'success' | 'danger' }> = {
  1: { label: '启用', variant: 'success' },
  0: { label: '禁用', variant: 'danger' },
}

export default function UserSection() {
  const [data, setData] = useState<SysUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ResultDTO<PageDTO<SysUser>>>('/system/users').then((res) => {
      if (res.data.code === 200) setData(res.data.data.records)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'id', label: 'ID', width: '50px' },
    { key: 'username', label: '用户名', width: '130px' },
    { key: 'displayName', label: '显示名称' },
    { key: 'phone', label: '手机号', width: '130px' },
    { key: 'email', label: '邮箱', width: '170px' },
    { key: 'deptName', label: '部门', width: '120px', render: (row: SysUser) => row.deptName || '-' },
    { key: 'roleCode', label: '角色', width: '130px', render: (row: SysUser) => <span style={{ fontSize: '0.8rem', padding: '0.125rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '0.25rem' }}>{roleLabels[row.roleCode] || row.roleCode}</span> },
    { key: 'status', label: '状态', width: '70px', render: (row: SysUser) => <Badge variant={statusMap[row.status]?.variant}>{row.statusName}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="用户管理" subtitle={`共 ${data.length} 个用户`} />
      <Card>
        <Table columns={columns} data={data} loading={loading} emptyText="暂无用户数据" />
      </Card>
    </div>
  )
}
