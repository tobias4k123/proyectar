import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

// Guarda las rutas de /admin: además del control que ya hace el backend
// (403 si el rol no es admin), esto evita que un alumno ni siquiera vea
// la pantalla -- lo manda al dashboard en vez de al login, porque el
// problema no es la sesión sino el rol.
function AdminRoute() {
  const usuario = useAuthStore((state) => state.usuario)

  if (usuario?.rol !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminRoute
