import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, Badge } from '@/components/Table'
import api, { ResultDTO, PageDTO } from '@/lib/api'

interface Warehouse {
  id: number
  code: string
  name: string
  address: string
  manager: string | null
  phone: string | null
  totalCapacity: number
  usedCapacity: number
  availableCapacity: number
  status: number
  statusName: string
}

export default function WarehouseList() {
  const [data, setData] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<ResultDTO<PageDTO<Warehouse>>>('/warehouse/warehouses').then((res) => {
      if (res.data.code === 200) setData(res.data.data.records)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="仓库管理" subtitle="管理仓库信息与库存" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', gridColumn: '1/-1' }}>加载中...</div>
        ) : data.map((wh) => {
          const usedPct = wh.totalCapacity > 0 ? (wh.usedCapacity / wh.totalCapacity * 100).toFixed(1) : '0'
          return (
            <Card key={wh.id} style={{ padding: '1.25rem', cursor: 'pointer' }}
              onClick={() => navigate('/warehouse/inbound')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>{wh.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{wh.code}</div>
                </div>
                <Badge variant={wh.status === 1 ? 'success' : 'danger'}>{wh.statusName}</Badge>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>{wh.address}</div>
              {wh.manager && <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>负责人：{wh.manager}</div>}

              {/* 容量进度条 */}
              <div style={{ marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  <span>容量使用</span>
                  <span>{usedPct}% ({wh.usedCapacity}/{wh.totalCapacity})</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${usedPct}%`, backgroundColor: Number(usedPct) > 80 ? '#ef4444' : Number(usedPct) > 60 ? '#f59e0b' : '#3b82f6', borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button style={{ flex: 1, padding: '0.375rem', backgroundColor: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}
                  onClick={(e) => { e.stopPropagation(); navigate('/warehouse/inbound') }}>
                  入库记录
                </button>
                <button style={{ flex: 1, padding: '0.375rem', backgroundColor: '#f0fdfa', color: '#14b8a6', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}
                  onClick={(e) => { e.stopPropagation(); navigate('/warehouse/outbound') }}>
                  出库记录
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
