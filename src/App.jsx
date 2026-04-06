import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FlotaPage from './pages/FlotaPage'
import ReservasPage from './pages/ReservasPage'
import ClientesPage from './pages/ClientesPage'
import PagosPage from './pages/PagosPage'
import ReportesPage from './pages/ReportesPage'

function PrivateRoute({ children }) {
  const { usuario } = useAuth()
  return usuario ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="flota" element={<FlotaPage />} />
            <Route path="reservas" element={<ReservasPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="pagos" element={<PagosPage />} />
            <Route path="reportes" element={<ReportesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
