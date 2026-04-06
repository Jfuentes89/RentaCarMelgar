import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/',         label: 'Dashboard', icon: '▦' },
  { to: '/flota',    label: 'Flota',     icon: '🚗' },
  { to: '/reservas', label: 'Reservas',  icon: '📅' },
  { to: '/clientes', label: 'Clientes',  icon: '👤' },
  { to: '/pagos',    label: 'Pagos',     icon: '💳' },
  { to: '/reportes', label: 'Reportes',  icon: '📊' },
]

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-52 flex flex-col" style={{ background: '#0C447C' }}>
        <div className="px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-lg" style={{ background: '#378ADD' }}>🚗</div>
          <p className="text-white text-sm font-medium leading-tight">Transportes Melgar</p>
          <p className="text-white/50 text-xs">Rent a Car</p>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-all border-l-2 ${
                  isActive
                    ? 'text-white bg-white/10 border-blue-300'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-medium">
              {usuario?.nombre?.charAt(0)}
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium leading-tight">{usuario?.nombre}</p>
              <p className="text-white/40 text-xs">{usuario?.rol}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left text-white/50 hover:text-white text-xs transition-colors">
            Cerrar sesión →
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
