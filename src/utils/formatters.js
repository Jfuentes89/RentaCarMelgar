export const formatCurrency = (n) =>
  new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(n || 0)

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export const estadoVehiculo = {
  DISPONIBLE:    { label: 'Disponible',    cls: 'badge-green' },
  ALQUILADO:     { label: 'Alquilado',     cls: 'badge-blue' },
  MANTENIMIENTO: { label: 'Mantenimiento', cls: 'badge-yellow' },
}
export const estadoReserva = {
  ACTIVA:     { label: 'Activa',     cls: 'badge-green' },
  FINALIZADA: { label: 'Finalizada', cls: 'badge-gray' },
  CANCELADA:  { label: 'Cancelada',  cls: 'badge-red' },
}
export const estadoPago = {
  PENDIENTE: { label: 'Pendiente', cls: 'badge-yellow' },
  PAGADO:    { label: 'Pagado',    cls: 'badge-green' },
  VENCIDO:   { label: 'Vencido',   cls: 'badge-red' },
}
