import { useState, useEffect } from 'react'
import { dashboardService } from '../services'
import { formatCurrency, formatDate } from '../utils/formatters'

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardService.obtener()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando dashboard...</div>
  if (error) return <div className="text-red-500 text-sm p-4">{error}</div>
  if (!data) return null

  const { flota, ingresosMes, pagosPendientes, reservasActivas, alertas } = data

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">{new Date().toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard label="Disponibles" value={flota.disponibles} sub={`de ${flota.total} en flota`} color="#185FA5" />
        <MetricCard label="Alquilados" value={flota.alquilados} sub="contratos activos" color="#3B6D11" />
        <MetricCard label="Ingresos del mes" value={formatCurrency(ingresosMes)} color="#1a1a1a" />
        <MetricCard label="En mantenimiento" value={flota.enMantenimiento} sub="fuera de servicio" color="#BA7517" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Alertas del día</h2>
            {alertas.contratosVencenHoy.length > 0 && (
              <span className="badge badge-red">{alertas.contratosVencenHoy.length} vencen hoy</span>
            )}
          </div>
          {alertas.contratosVencenHoy.length === 0 && alertas.mantenimientoProximo.length === 0 ? (
            <p className="text-sm text-gray-400">Sin alertas pendientes</p>
          ) : (
            <div className="space-y-2">
              {alertas.contratosVencenHoy.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                  <span className="text-gray-700">{r.cliente?.nombreCompleto} — contrato vence hoy</span>
                </div>
              ))}
              {alertas.mantenimientoProximo.map(v => (
                <div key={v.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>
                  <span className="text-gray-700">{v.marca} {v.modelo} ({v.placa}) — mantenimiento próximo</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Reservas activas</h2>
            <span className="badge badge-blue">{reservasActivas.length}</span>
          </div>
          <div className="space-y-2">
            {reservasActivas.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{r.cliente?.nombreCompleto}</p>
                  <p className="text-xs text-gray-400">{r.vehiculo?.marca} {r.vehiculo?.modelo} • hasta {formatDate(r.fechaRetorno)}</p>
                </div>
                <span className="text-xs font-medium text-gray-600">{formatCurrency(r.total)}</span>
              </div>
            ))}
            {reservasActivas.length === 0 && <p className="text-sm text-gray-400">Sin reservas activas</p>}
          </div>
        </div>
      </div>

      {flota.total > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Disponibilidad de flota</h2>
          <div className="flex gap-4 mb-3">
            {[['#639922','Disponible',flota.disponibles],['#185FA5','Alquilado',flota.alquilados],['#BA7517','Mantenimiento',flota.enMantenimiento]].map(([c,l,n]) => (
              <div key={l} className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 rounded" style={{ background: c }}></div>{l} ({n})
              </div>
            ))}
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: flota.total }, (_, i) => {
              const color = i < flota.disponibles ? '#639922' : i < flota.disponibles + flota.alquilados ? '#185FA5' : '#BA7517'
              return <div key={i} className="h-8 rounded" style={{ background: color }}></div>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
