import { useState, useEffect } from 'react'
import { pagosService } from '../services'
import { formatCurrency, formatDate, estadoPago } from '../utils/formatters'

const metodoLabel = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta' }

export default function PagosPage() {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')

  const cargar = () => {
    setLoading(true)
    pagosService.listar(filtroEstado ? { estado: filtroEstado } : {})
      .then(setPagos)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filtroEstado])

  const registrarPago = async (pago) => {
    const metodo = prompt('Método de pago (EFECTIVO, TRANSFERENCIA, TARJETA):', pago.metodo)
    if (!metodo) return
    const comprobante = metodo !== 'EFECTIVO' ? (prompt('Número de comprobante:') || '') : ''
    try {
      await pagosService.registrar(pago.id, { metodo, comprobante })
      cargar()
    } catch (err) { alert(err.message || 'Error al registrar pago') }
  }

  const totalPagado = pagos.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + Number(p.monto), 0)
  const totalPendiente = pagos.filter(p => p.estado === 'PENDIENTE').reduce((s, p) => s + Number(p.monto), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Control de pagos</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card bg-green-50 border-green-100">
          <p className="text-xs text-green-700 mb-1">Total cobrado (filtro actual)</p>
          <p className="text-2xl font-semibold text-green-800">{formatCurrency(totalPagado)}</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-100">
          <p className="text-xs text-yellow-700 mb-1">Total pendiente</p>
          <p className="text-2xl font-semibold text-yellow-800">{formatCurrency(totalPendiente)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Total de registros</p>
          <p className="text-2xl font-semibold text-gray-800">{pagos.length}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <select className="input w-48" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="PAGADO">Pagados</option>
          <option value="VENCIDO">Vencidos</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Reserva', 'Cliente', 'Vehículo', 'Monto', 'Método', 'Fecha de pago', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : pagos.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No hay pagos</td></tr>
            ) : pagos.map(p => {
              const est = estadoPago[p.estado]
              return (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.reserva?.id?.slice(0,6)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.reserva?.cliente?.nombreCompleto}</td>
                  <td className="px-4 py-3 text-gray-600">{p.reserva?.vehiculo?.marca} {p.reserva?.vehiculo?.modelo}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(p.monto)}</td>
                  <td className="px-4 py-3 text-gray-600">{metodoLabel[p.metodo] || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(p.fechaPago)}</td>
                  <td className="px-4 py-3"><span className={est.cls + ' badge'}>{est.label}</span></td>
                  <td className="px-4 py-3">
                    {p.estado === 'PENDIENTE' && (
                      <button onClick={() => registrarPago(p)} className="text-xs text-melgar-600 hover:underline">Registrar pago</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
