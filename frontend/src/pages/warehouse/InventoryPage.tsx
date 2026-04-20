import { useEffect, useState } from 'react'
import { PageHeader, Card, Table } from '@/components/Table'
import api, { ResultDTO, PageDTO } from '@/lib/api'

interface Inventory {
  id: number
  skuCode: string
  skuName: string
  warehouseId: number
  warehouseName: string
  locationId: number
  locationCode: string
  quantity: number
  frozenQuantity: number
  availableQuantity: number
  updatedAt: string
}

export default function InventoryPage() {
  const [data, setData] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    api.get<ResultDTO<PageDTO<Inventory>>>('/warehouse/inventory', {
      params: { keyword: keyword || undefined, page: 1, size: 50 }
    }).then((res) => {
      if (res.data.code === 200) setData(res.data.data.records)
    }).catch(console.error).finally(() => setLoading(false))
  }, [keyword])

  const columns = [
    { key: 'id', label: 'ID', width: '50px' },
    { key: 'skuCode', label: 'SKU', width: '110px' },
    { key: 'skuName', label: '商品名称' },
    { key: 'warehouseName', label: '仓库', width: '130px' },
    { key: 'locationCode', label: '库位', width: '90px' },
    { key: 'quantity', label: '库存量', width: '80px', render: (row: Inventory) => <span style={{ fontWeight: 600 }}>{row.quantity}</span> },
    { key: 'frozenQuantity', label: '冻结', width: '70px', render: (row: Inventory) => row.frozenQuantity > 0 ? <span style={{ color: '#ef4444' }}>{row.frozenQuantity}</span> : '0' },
    { key: 'availableQuantity', label: '可用', width: '80px', render: (row: Inventory) => <span style={{ color: '#10b981', fontWeight: 600 }}>{row.availableQuantity}</span> },
    { key: 'updatedAt', label: '更新时间', width: '150px', render: (row: Inventory) => row.updatedAt?.slice(0, 16).replace('T', ' ') },
  ]

  return (
    <div>
      <PageHeader
        title="库存查询"
        subtitle="查看各仓库商品库存情况"
      />
      <Card>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
          <input
            className="input-field"
            style={{ maxWidth: '300px' }}
            placeholder="搜索 SKU 或商品名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <Table columns={columns} data={data} loading={loading} emptyText="暂无库存数据" />
      </Card>
    </div>
  )
}
