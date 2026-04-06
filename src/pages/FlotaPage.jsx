import { useState, useEffect } from 'react'
import { vehiculosService } from '../services'
import { estadoVehiculo } from '../utils/formatters'

const tipoLabel = { SEDAN: 'Sedán', SUV: 'SUV', PICKUP: 'Pick-up', VAN: 'Van' }

function VehiculoModal({ vehiculo, onClose, onSaved }) {
  const isNew = !vehiculo?.id
  const [form, setForm] = useState(vehiculo || {
    placa:'', marca:'', modelo:'', anio: new Date().getFullYear(),
    tipo:'SEDAN', color:'', kilometraje:0, precioDia:''
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isNew) await vehiculosService.crear(form)
      else await vehiculosService.actualizar(vehiculo.id, form)
      onSaved()
    } catch (err) {
      alert(err.message || 'Error al guardar')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">{isNew ? 'Agregar vehículo' : 'Editar vehículo'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Placa</label>
              <input className="input" value={form.placa} onChange={e => set('placa', e.target.value)} required placeholder="P-000-ABC" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                {Object.entries(tipoLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
              <input className="input" value={form.marca} onChange={e => set('marca', e.target.value)} required /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
              <input className="input" value={form.modelo} onChange={e => set('modelo', e.target.value)} required /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
              <input className="input" type="number" value={form.anio} onChange={e => set('anio', Number(e.target.value))} required /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
              <input className="input" value={form.color} onChange={e => set('color', e.target.value)} required /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Kilometraje</label>
              <input className="input" type="number" value={form.kilometraje} onChange={e => set('kilometraje', Number(e.target.value))} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Precio por día ($)</label>
              <input className="input" type="number" step="0.01" value={form.precioDia} onChange={e => set('precioDia', e.target.value)} required /></div>
          </div>
          {!isNew && (
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <select className="input" value={form.estado} onChange={e => set('estado', e.target.value)}>
                <option value="DISPONIBLE">Disponible</option>
                <option value="MANTENIMIENTO">En mantenimiento</option>
              </select></div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FlotaPage() {
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(null)

  const cargar = (s = search, e = filtroEstado) => {
    setLoading(true)
    vehiculosService.listar({ search: s, estado: e })
      .then(setVehiculos)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar('', filtroEstado) }, [filtroEstado])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Flota de vehículos</h1>
        <button className="btn-primary" onClick={() => setModal({})}>+ Agregar vehículo</button>
      </div>

      <div className="flex gap-3 mb-5">
        <form onSubmit={e => { e.preventDefault(); cargar(search, filtroEstado) }} className="flex gap-2 flex-1">
          <input className="input flex-1" placeholder="Buscar por placa, marca o modelo..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-secondary px-4">Buscar</button>
        </form>
        <select className="input w-48" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="DISPONIBLE">Disponible</option>
          <option value="ALQUILADO">Alquilado</option>
          <option value="MANTENIMIENTO">Mantenimiento</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Cargando vehículos...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {vehiculos.map(v => {
            const est = estadoVehiculo[v.estado]
            return (
              <div key={v.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setModal(v)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: '#E6F1FB' }}>🚗</div>
                  <span className={est.cls + ' badge'}>{est.label}</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{v.placa}</p>
                <p className="text-sm text-gray-600">{v.marca} {v.modelo} {v.anio}</p>
                <p className="text-xs text-gray-400 mt-1">{tipoLabel[v.tipo]} • {v.kilometraje?.toLocaleString()} km</p>
                <p className="text-sm font-medium text-melgar-600 mt-2">${v.precioDia}/día</p>
              </div>
            )
          })}
          {vehiculos.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">No se encontraron vehículos</div>
          )}
        </div>
      )}

      {modal !== null && (
        <VehiculoModal
          vehiculo={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}
