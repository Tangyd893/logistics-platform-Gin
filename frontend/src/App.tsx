import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import Login from '@/pages/Login'
import Layout from '@/pages/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import WarehouseList from '@/pages/warehouse/WarehouseList'
import WarehouseDetail from '@/pages/warehouse/WarehouseDetail'
import InventoryPage from '@/pages/warehouse/InventoryPage'
import LocationPage from '@/pages/warehouse/LocationPage'
import OrderList from '@/pages/order/OrderList'
import OrderCreate from '@/pages/order/OrderCreate'
import OrderDetail from '@/pages/order/OrderDetail'
import TransportList from '@/pages/transport/TransportList'
import WaybillCreate from '@/pages/transport/WaybillCreate'
import TrackingPage from '@/pages/transport/TrackingPage'
import DriverPage from '@/pages/transport/DriverPage'
import VehiclePage from '@/pages/transport/VehiclePage'
import StatisticsPage from '@/pages/statistics/StatisticsPage'
import SystemPage from '@/pages/system/SystemPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="warehouse" element={<WarehouseList />} />
          <Route path="warehouse/inbound" element={<WarehouseDetail />} />
          <Route path="warehouse/outbound" element={<WarehouseDetail />} />
          <Route path="warehouse/inventory" element={<InventoryPage />} />
          <Route path="warehouse/locations" element={<LocationPage />} />
          <Route path="order" element={<OrderList />} />
          <Route path="order/new" element={<OrderCreate />} />
          <Route path="order/:id" element={<OrderDetail />} />
          <Route path="transport" element={<TransportList />} />
          <Route path="transport/new" element={<WaybillCreate />} />
          <Route path="transport/tracking" element={<TrackingPage />} />
          <Route path="transport/drivers" element={<DriverPage />} />
          <Route path="transport/vehicles" element={<VehiclePage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="system" element={<SystemPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
