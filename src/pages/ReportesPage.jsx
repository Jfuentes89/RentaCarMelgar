import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { reportesService, dashboardService } from '../services'
import { formatCurrency } from '../utils/formatters'

export default function ReportesPage() {
  const [ingresos, setIngresos] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reportesService.ingresosPorMes(6),
      dashboardService.obtener()
    ]).then(([ing, dash]) => {
      setIngresos(ing)
      setDashboard(dash)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando reportes...</div>

  const flota = dashboard?.flota || { total: 0, disponibles: 0, alquilados: 0, enMantenimiento: 0 }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reportes</h1>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Ingresos mensuales */}
        <div className="card col-span-2">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Ingresos últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ingresos} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [formatCurrency(v), 'Ingresos']} />
              <Bar dataKey="total" fill="#185FA5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estado de flota */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Estado actual de flota</h2>
          {flota.total > 0 ? (
            <>
              <div className="h-4 rounded-full overflow-hidden flex mb-4">
                <div style={{ width: `${(flota.disponibles/flota.total)*100}%`, background: '#639922' }}></div>
                <div style={{ width: `${(flota.alquilados/flota.total)*100}%`, background: '#185FA5' }}></div>
                <div style={{ width: `${(flota.enMantenimiento/flota.total)*100}%`, background: '#BA7517' }}></div>
              </div>
              <div className="space-y-2">
                {[['#639922','Disponible',flota.disponibles],['#185FA5','Alquilado',flota.alquilados],['#BA7517','Mantenimiento',flota.enMantenimiento]].map(([c,l,n]) => (
                  <div key={l} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: c }}></div>
                      <span className="text-gray-600">{l}</span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {n} vehículos ({flota.total > 0 ? Math.round((n/flota.total)*100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Sin vehículos registrados</p>
          )}
        </div>

        {/* Resumen de ingresos */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Resumen de ingresos</h2>
          {ingresos.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos de ingresos</p>
          ) : (
            <div className="space-y-3">
              {ingresos.map(i => {
                const maxTotal = Math.max(...ingresos.map(x => x.total), 1)
                return (
                  <div key={i.mes} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs text-gray-500 w-16">{i.mes}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ background: '#185FA5', width: `${Math.round((i.total / maxTotal) * 100)}%` }}></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 ml-3 w-20 text-right">{formatCurrency(i.total)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
