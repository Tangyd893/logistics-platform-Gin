import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { PageHeader, Card } from '@/components/Table'
import api, { ResultDTO } from '@/lib/api'
import L from 'leaflet'

// Fix default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Waybill {
  id: number
  waybillNo: string
  orderId: number
  fromAddress: string
  toAddress: string
  status: number
  statusName: string
  driverName: string | null
  vehiclePlateNo: string | null
}

const DEFAULT_CENTER: [number, number] = [31.0, 121.0]
const addressCoords: Record<string, [number, number]> = {
  '上海': [31.2304, 121.4737],
  '北京': [39.9042, 116.4074],
  '广州': [23.1291, 113.2644],
  '深圳': [22.5431, 114.0579],
  '杭州': [30.2741, 120.1551],
  '成都': [30.5728, 104.0668],
  '武汉': [30.5928, 114.3055],
  '西安': [34.3416, 108.9398],
  '南京': [32.0603, 118.7969],
  '重庆': [29.4316, 106.9123],
}

function getCoord(address: string): [number, number] {
  if (!address) return DEFAULT_CENTER
  for (const [city, coord] of Object.entries(addressCoords)) {
    if (address.includes(city)) return coord
  }
  return DEFAULT_CENTER
}

const statusColors: Record<number, string> = {
  10: '#94a3b8',
  20: '#3b82f6',
  30: '#8b5cf6',
  40: '#10b981',
  50: '#f59e0b',
  60: '#059669',
}

function MapView({ waybill }: { waybill: Waybill }) {
  const map = useMap()
  const from = getCoord(waybill.fromAddress)
  const to = getCoord(waybill.toAddress)

  useEffect(() => {
    map.setView(from, 6)
    // Small delay to ensure map is ready
    const timer = setTimeout(() => map.fitBounds([from, to], { padding: [40, 40] }), 100)
    return () => clearTimeout(timer)
  }, [waybill, from, to, map])

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={from}>
        <Popup>
          <b style={{ fontSize: '0.8rem' }}>📍 发货地</b><br />
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{waybill.fromAddress}</span>
        </Popup>
      </Marker>
      <Marker position={to}>
        <Popup>
          <b style={{ fontSize: '0.8rem' }}>🏁 收货地</b><br />
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{waybill.toAddress}</span>
        </Popup>
      </Marker>
    </>
  )
}

export default function TrackingPage() {
  const [waybills, setWaybills] = useState<Waybill[]>([])
  const [selected, setSelected] = useState<Waybill | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ResultDTO<{ records: Waybill[] }>>('/transport/waybills?size=50')
      .then((r) => { if (r.data.code === 200) {
        const records = r.data.data.records || []
        setWaybills(records)
        // 检查是否有预选的运单 ID（从 TransportList 点击运单号传来）
        const preselectId = sessionStorage.getItem('tracking_waybill_id')
        if (preselectId) {
          sessionStorage.removeItem('tracking_waybill_id')
          const preselect = records.find((w: Waybill) => String(w.id) === preselectId)
          if (preselect) setSelected(preselect)
        }
      }})
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="配送跟踪" subtitle="实时查看运单配送状态与地理位置" />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem', height: 'calc(100vh - 180px)' }}>
        {/* 左侧：运单列表 */}
        <Card style={{ overflowY: 'auto', padding: 0 }}>
          <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
            运单列表（{waybills.length}）
          </div>
          {loading ? (
            <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>加载中...</div>
          ) : waybills.length === 0 ? (
            <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>暂无运单数据</div>
          ) : waybills.map((w) => (
            <div
              key={w.id}
              onClick={() => setSelected(w)}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #f1f5f9',
                cursor: 'pointer',
                backgroundColor: selected?.id === w.id ? '#f0f7ff' : 'white',
                borderLeft: selected?.id === w.id ? `3px solid ${statusColors[w.status] || '#3b82f6'}` : '3px solid transparent',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.2rem' }}>{w.waybillNo}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.15rem' }}>
                {w.fromAddress?.slice(0, 14)}… → {w.toAddress?.slice(0, 14)}…
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColors[w.status] || '#94a3b8', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', color: statusColors[w.status] || '#64748b', fontWeight: 500 }}>{w.statusName}</span>
                {w.driverName && <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 'auto' }}>{w.driverName}</span>}
              </div>
            </div>
          ))}
        </Card>

        {/* 右侧：地图 */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {selected ? (
            <MapContainer
              style={{ height: '100%', width: '100%' }}
            >
              <MapView waybill={selected} />
            </MapContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗺️</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>点击左侧运单查看配送路线</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#cbd5e1', maxWidth: '260px', textAlign: 'center' }}>
                演示模式：坐标基于城市名称模拟定位
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
