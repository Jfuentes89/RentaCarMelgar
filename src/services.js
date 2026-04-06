// Capa de servicio Firebase — reemplaza el backend Node.js/PostgreSQL
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Utilidades ──────────────────────────────────────────────────────────────

const col = (name) => collection(db, name)

const snap2arr = (snapshot) =>
  snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

const toDate = (v) => {
  if (!v) return null
  if (v instanceof Timestamp) return v.toDate()
  if (v instanceof Date) return v
  return new Date(v)
}

// ─── VEHÍCULOS ────────────────────────────────────────────────────────────────

export const vehiculosService = {
  async listar(filtros = {}) {
    let q = query(col('vehiculos'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    let items = snap2arr(snap)
    if (filtros.estado) items = items.filter(v => v.estado === filtros.estado)
    if (filtros.search) {
      const s = filtros.search.toLowerCase()
      items = items.filter(v =>
        v.placa?.toLowerCase().includes(s) ||
        v.marca?.toLowerCase().includes(s) ||
        v.modelo?.toLowerCase().includes(s)
      )
    }
    return items
  },
  async obtener(id) {
    const snap = await getDoc(doc(db, 'vehiculos', id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },
  async crear(data) {
    const ref = await addDoc(col('vehiculos'), {
      ...data,
      anio: Number(data.anio),
      kilometraje: Number(data.kilometraje || 0),
      precioDia: Number(data.precioDia),
      estado: 'DISPONIBLE',
      createdAt: serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async actualizar(id, data) {
    await updateDoc(doc(db, 'vehiculos', id), {
      ...data,
      anio: Number(data.anio),
      kilometraje: Number(data.kilometraje || 0),
      precioDia: Number(data.precioDia)
    })
  },
  async eliminar(id) {
    await deleteDoc(doc(db, 'vehiculos', id))
  }
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────

export const clientesService = {
  async listar(filtros = {}) {
    const snap = await getDocs(query(col('clientes'), orderBy('createdAt', 'desc')))
    let items = snap2arr(snap)
    if (filtros.search) {
      const s = filtros.search.toLowerCase()
      items = items.filter(c =>
        c.nombreCompleto?.toLowerCase().includes(s) ||
        c.dui?.includes(s) ||
        c.telefono?.includes(s)
      )
    }
    return items
  },
  async obtener(id) {
    const snap = await getDoc(doc(db, 'clientes', id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },
  async crear(data) {
    const ref = await addDoc(col('clientes'), {
      ...data,
      tieneIncidente: false,
      createdAt: serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async actualizar(id, data) {
    await updateDoc(doc(db, 'clientes', id), data)
  }
}

// ─── RESERVAS ────────────────────────────────────────────────────────────────

export const reservasService = {
  async listar(filtros = {}) {
    const snap = await getDocs(query(col('reservas'), orderBy('createdAt', 'desc')))
    let items = snap2arr(snap)
    if (filtros.estado) items = items.filter(r => r.estado === filtros.estado)

    // Enriquecer con datos de cliente y vehículo
    const clienteIds = [...new Set(items.map(r => r.clienteId).filter(Boolean))]
    const vehiculoIds = [...new Set(items.map(r => r.vehiculoId).filter(Boolean))]

    const [clientesSnap, vehiculosSnap] = await Promise.all([
      getDocs(col('clientes')),
      getDocs(col('vehiculos'))
    ])
    const clientesMap = Object.fromEntries(clientesSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]))
    const vehiculosMap = Object.fromEntries(vehiculosSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]))

    return items.map(r => ({
      ...r,
      fechaSalida: toDate(r.fechaSalida),
      fechaRetorno: toDate(r.fechaRetorno),
      cliente: clientesMap[r.clienteId] || null,
      vehiculo: vehiculosMap[r.vehiculoId] || null
    }))
  },

  async crear(data, usuarioId) {
    const vehiculoSnap = await getDoc(doc(db, 'vehiculos', data.vehiculoId))
    if (!vehiculoSnap.exists()) throw new Error('Vehículo no encontrado')

    const dias = Math.ceil(
      (new Date(data.fechaRetorno) - new Date(data.fechaSalida)) / (1000 * 60 * 60 * 24)
    )
    const precioDia = Number(vehiculoSnap.data().precioDia)
    const total = dias * precioDia

    // Crear reserva
    const reservaRef = await addDoc(col('reservas'), {
      clienteId: data.clienteId,
      vehiculoId: data.vehiculoId,
      usuarioId,
      fechaSalida: Timestamp.fromDate(new Date(data.fechaSalida)),
      fechaRetorno: Timestamp.fromDate(new Date(data.fechaRetorno)),
      total,
      estado: 'ACTIVA',
      observaciones: data.observaciones || '',
      createdAt: serverTimestamp()
    })

    // Crear pago asociado
    await addDoc(col('pagos'), {
      reservaId: reservaRef.id,
      monto: total,
      metodo: data.metodoPago || 'EFECTIVO',
      estado: 'PENDIENTE',
      fechaPago: null,
      comprobante: '',
      createdAt: serverTimestamp()
    })

    // Marcar vehículo como alquilado
    await updateDoc(doc(db, 'vehiculos', data.vehiculoId), { estado: 'ALQUILADO' })

    return { id: reservaRef.id }
  },

  async cambiarEstado(id, estado) {
    const reservaSnap = await getDoc(doc(db, 'reservas', id))
    if (!reservaSnap.exists()) throw new Error('Reserva no encontrada')
    const reserva = reservaSnap.data()

    await updateDoc(doc(db, 'reservas', id), { estado })

    // Si se finaliza o cancela, liberar el vehículo
    if (estado === 'FINALIZADA' || estado === 'CANCELADA') {
      await updateDoc(doc(db, 'vehiculos', reserva.vehiculoId), { estado: 'DISPONIBLE' })
    }
    // Si se cancela, marcar pago como vencido
    if (estado === 'CANCELADA') {
      const pagosSnap = await getDocs(query(col('pagos'), where('reservaId', '==', id)))
      for (const p of pagosSnap.docs) {
        if (p.data().estado === 'PENDIENTE')
          await updateDoc(p.ref, { estado: 'VENCIDO' })
      }
    }
  }
}

// ─── PAGOS ───────────────────────────────────────────────────────────────────

export const pagosService = {
  async listar(filtros = {}) {
    const snap = await getDocs(query(col('pagos'), orderBy('createdAt', 'desc')))
    let items = snap2arr(snap)
    if (filtros.estado) items = items.filter(p => p.estado === filtros.estado)

    // Enriquecer con reserva → cliente + vehículo
    const reservasSnap = await getDocs(col('reservas'))
    const clientesSnap = await getDocs(col('clientes'))
    const vehiculosSnap = await getDocs(col('vehiculos'))

    const reservasMap = Object.fromEntries(reservasSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]))
    const clientesMap = Object.fromEntries(clientesSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]))
    const vehiculosMap = Object.fromEntries(vehiculosSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]))

    return items.map(p => {
      const reserva = reservasMap[p.reservaId]
      return {
        ...p,
        fechaPago: toDate(p.fechaPago),
        reserva: reserva ? {
          ...reserva,
          cliente: clientesMap[reserva.clienteId] || null,
          vehiculo: vehiculosMap[reserva.vehiculoId] || null
        } : null
      }
    })
  },

  async registrar(id, data) {
    await updateDoc(doc(db, 'pagos', id), {
      metodo: data.metodo,
      comprobante: data.comprobante || '',
      estado: 'PAGADO',
      fechaPago: serverTimestamp()
    })
  }
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const dashboardService = {
  async obtener() {
    const [vehiculosSnap, reservasSnap, pagosSnap] = await Promise.all([
      getDocs(col('vehiculos')),
      getDocs(query(col('reservas'), orderBy('createdAt', 'desc'))),
      getDocs(col('pagos'))
    ])

    const vehiculos = snap2arr(vehiculosSnap)
    const reservas = snap2arr(reservasSnap)
    const pagos = snap2arr(pagosSnap)

    const clientesSnap = await getDocs(col('clientes'))
    const clientesMap = Object.fromEntries(clientesSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]))
    const vehiculosMap = Object.fromEntries(vehiculosSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]))

    const flota = {
      total: vehiculos.length,
      disponibles: vehiculos.filter(v => v.estado === 'DISPONIBLE').length,
      alquilados: vehiculos.filter(v => v.estado === 'ALQUILADO').length,
      enMantenimiento: vehiculos.filter(v => v.estado === 'MANTENIMIENTO').length
    }

    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const ingresosMes = pagos
      .filter(p => p.estado === 'PAGADO' && toDate(p.fechaPago) >= inicioMes)
      .reduce((s, p) => s + Number(p.monto), 0)

    const pagosPendientes = pagos.filter(p => p.estado === 'PENDIENTE').length

    const reservasActivas = reservas
      .filter(r => r.estado === 'ACTIVA')
      .map(r => ({
        ...r,
        fechaRetorno: toDate(r.fechaRetorno),
        cliente: clientesMap[r.clienteId] || null,
        vehiculo: vehiculosMap[r.vehiculoId] || null
      }))

    const hoyStr = ahora.toDateString()
    const en3dias = new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000)
    const alertas = {
      contratosVencenHoy: reservasActivas.filter(r =>
        r.fechaRetorno && r.fechaRetorno.toDateString() === hoyStr
      ),
      mantenimientoProximo: vehiculos.filter(v => {
        if (!v.proxMantenimiento) return false
        const d = toDate(v.proxMantenimiento)
        return d && d <= en3dias
      })
    }

    return { flota, ingresosMes, pagosPendientes, reservasActivas, alertas }
  }
}

// ─── REPORTES ────────────────────────────────────────────────────────────────

export const reportesService = {
  async ingresosPorMes(meses = 6) {
    const snap = await getDocs(col('pagos'))
    const pagos = snap2arr(snap).filter(p => p.estado === 'PAGADO')

    const mesesLabels = []
    const ahora = new Date()
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      mesesLabels.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('es-SV', { month: 'short', year: '2-digit' })
      })
    }

    return mesesLabels.map(({ key, label }) => {
      const total = pagos
        .filter(p => {
          const d = toDate(p.fechaPago)
          if (!d) return false
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return k === key
        })
        .reduce((s, p) => s + Number(p.monto), 0)
      return { mes: label, total }
    })
  }
}
