import { useState, useEffect } from 'react'
import { reservasService, clientesService, vehiculosService } from '../services'
import { formatCurrency, formatDate, estadoReserva } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

function NuevaReservaModal({ onClose, onSaved }) {
  const { usuario } = useAuth()
  const [clientes, setClientes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [form, setForm] = useState({
    clienteId: '', vehiculoId: '', fechaSalida: '', fechaRetorno: '',
    metodoPago: 'EFECTIVO', observaciones: ''
  })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    clientesService.listar().then(setClientes)
    vehiculosService.listar({ estado: 'DISPONIBLE' }).then(setVehiculos)
  }, [])

  useEffect(() => {
    if (form.vehiculoId && form.fechaSalida && form.fechaRetorno) {
      const v = vehiculos.find(v => v.id === form.vehiculoId)
      const dias = Math.ceil((new Date(form.fechaRetorno) - new Date(form.fechaSalida)) / (1000*60*60*24))
      setTotal(v && dias > 0 ? Number(v.precioDia) * dias : 0)
    }
  }, [form.vehiculoId, form.fechaSalida, form.fechaRetorno, vehiculos])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await reservasService.crear(form, usuario.uid)
      onSaved()
    } catch (err) {
      alert(err.message || 'Error al crear reserva')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Nueva reserva</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
            <select className="input" value={form.clienteId} onChange={e => set('clienteId', e.target.value)} required>
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreCompleto} — {c.dui}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vehículo disponible</label>
            <select className="input" value={form.vehiculoId} onChange={e => set('vehiculoId', e.target.value)} required>
              <option value="">Seleccionar vehículo...</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa}) — ${v.precioDia}/día</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de salida</label>
              <input type="date" className="input" value={form.fechaSalida} onChange={e => set('fechaSalida', e.target.value)} required /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha de retorno</label>
              <input type="date" className="input" value={form.fechaRetorno} onChange={e => set('fechaRetorno', e.target.value)} required /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Método de pago</label>
            <select className="input" value={form.metodoPago} onChange={e => set('metodoPago', e.target.value)}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
            <textarea className="input" rows={2} value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
          </div>
          {total > 0 && (
            <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-blue-700">Total estimado</span>
              <span className="font-semibold text-blue-800 text-lg">{formatCurrency(total)}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Guardando...' : 'Crear reserva'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(false)

  const cargar = () => {
    setLoading(true)
    reservasService.listar(filtroEstado ? { estado: filtroEstado } : {})
      .then(setReservas)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filtroEstado])

  const cambiarEstado = async (id, estado) => {
    if (!confirm(`¿Cambiar estado a ${estado}?`)) return
    try {
      await reservasService.cambiarEstado(id, estado)
      cargar()
    } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reservas</h1>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nueva reserva</button>
      </div>

      <div className="flex gap-3 mb-5">
        <select className="input w-48" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVA">Activas</option>
          <option value="FINALIZADA">Finalizadas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['#', 'Cliente', 'Vehículo', 'Salida', 'Retorno', 'Total', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : reservas.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No hay reservas</td></tr>
            ) : reservas.map(r => {
              const est = estadoReserva[r.estado]
              return (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.id.slice(0,6)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{r.cliente?.nombreCompleto}</p>
                    <p className="text-xs text-gray-400">{r.cliente?.dui}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{r.vehiculo?.marca} {r.vehiculo?.modelo}</p>
                    <p className="text-xs text-gray-400">{r.vehiculo?.placa}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(r.fechaSalida)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(r.fechaRetorno)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(r.total)}</td>
                  <td className="px-4 py-3"><span className={est.cls + ' badge'}>{est.label}</span></td>
                  <td className="px-4 py-3">
                    {r.estado === 'ACTIVA' && (
                      <div className="flex gap-1">
                        <button onClick={() => cambiarEstado(r.id, 'FINALIZADA')} className="text-xs text-green-600 hover:underline">Finalizar</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => cambiarEstado(r.id, 'CANCELADA')} className="text-xs text-red-500 hover:underline">Cancelar</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && <NuevaReservaModal onClose={() => setModal(false)} onSaved={() => { setModal(false); cargar() }} />}
    </div>
  )
}
