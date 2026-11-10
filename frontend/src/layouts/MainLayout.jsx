import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { queryClient } from '../lib/queryClient'

// El mapa de Mi Carrera aprovecha todo el ancho que haya: limitarlo como al
// resto de las pantallas deja cientos de píxeles en blanco a los costados y
// obliga a dibujar las materias más chicas de lo necesario. El resto sigue
// con el ancho máximo de siempre, porque un texto o una tabla estirados a
// lo ancho de un monitor grande se leen peor.
const RUTAS_ANCHO_COMPLETO = ['/mi-carrera']

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/mi-carrera', label: 'Mi Carrera' },
  { to: '/plan-de-estudios', label: 'Plan de Estudios' },
  { to: '/historial', label: 'Historial Académico' },
  { to: '/ruta-critica', label: 'Ruta Crítica' },
]

function MainLayout() {
  const usuario = useAuthStore((state) => state.usuario)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const anchoCompleto = RUTAS_ANCHO_COMPLETO.includes(location.pathname)

  // Los admins ven además el link a /admin -- el backend ya exige el rol
  // en cada endpoint, esto es sólo para no mostrarle el link a un alumno.
  const itemsDeNav =
    usuario?.rol === 'admin' ? [...navItems, { to: '/admin', label: 'Administración' }] : navItems

  function handleLogout() {
    logout()
    // Se descartan los datos en caché: si entra otro usuario en el mismo
    // navegador no tiene que ver, ni por un instante, el avance del anterior.
    queryClient.clear()
    navigate('/login')
  }

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">ProyectAR</span>

          {isAuthenticated && (
            <nav className="flex gap-1">
              {itemsDeNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{usuario?.nombre}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Salir
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Ingresar
            </NavLink>
          )}
        </div>
      </header>
      <main
        className={`mx-auto w-full flex-1 px-6 py-8 ${anchoCompleto ? '' : 'max-w-7xl'}`}
      >
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
