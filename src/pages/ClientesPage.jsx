import { useState, useEffect } from 'react'
import { clientesService } from '../services'

function ClienteModal({ cliente, onClose, onSaved }) {
  const isNew = !cliente?.id
  const [form, setForm] = useState(cliente || { nombreCompleto:'', dui:'', licencia:'', telefono:'', email:'', direccion:'' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (isNew) await clientesService.crear(form)
      else await clientesService.actualizar(cliente.id, form)
      onSaved()
    } catch (err) { alert(err.message || 'Error al guardar') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">{isNew ? 'Nuevo cliente' : 'Editar cliente'}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
            <input className="input" value={form.nombreCompleto} onChange={e => set('nombreCompleto', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">DUI</label>
              <input className="input" value={form.dui} onChange={e => set('dui', e.target.value)} required placeholder="00000000-0" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Licencia</label>
              <input className="input" value={form.licencia} onChange={e => set('licencia', e.target.value)} required /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <input className="input" value={form.telefono} onChange={e => set('telefono', e.target.value)} required placeholder="7000-0000" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
            <input className="input" value={form.direccion} onChange={e => set('direccion', e.target.value)} /></div>
          {!isNew && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="incidente" checked={form.tieneIncidente || false}
                onChange={e => set('tieneIncidente', e.target.checked)} />
              <label htmlFor="incidente" className="text-xs text-gray-600">Tiene incidente registrado</label>
            </div>
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  const cargar = (q = '') => {
    setLoading(true)
    clientesService.listar(q ? { search: q } : {})
      .then(setClientes)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
        <button className="btn-primary" onClick={() => setModal({})}>+ Nuevo cliente</button>
      </div>

      <form className="flex gap-2 mb-5" onSubmit={e => { e.preventDefault(); cargar(search) }}>
        <input className="input flex-1" placeholder="Buscar por nombre, DUI o teléfono..." value={search} onChange={e => setSearch(e.target.value)} />
        <button type="submit" className="btn-secondary px-4">Buscar</button>
        {search && <button type="button" className="btn-secondary" onClick={() => { setSearch(''); cargar() }}>Limpiar</button>}
      </form>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Cliente', 'DUI', 'Licencia', 'Teléfono', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : clientes.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No se encontraron clientes</td></tr>
            ) : clientes.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium flex-shrink-0">
                      {c.nombreCompleto?.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800">{c.nombreCompleto}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.dui}</td>
                <td className="px-4 py-3 text-gray-600">{c.licencia}</td>
                <td className="px-4 py-3 text-gray-600">{c.telefono}</td>
                <td className="px-4 py-3">
                  {c.tieneIncidente
                    ? <span className="badge badge-red">Con incidente</span>
                    : <span className="badge badge-green">Activo</span>}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setModal(c)} className="text-xs text-melgar-600 hover:underline">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <ClienteModal
          cliente={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}
