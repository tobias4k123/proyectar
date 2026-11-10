import { Navigate, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Dashboard from './pages/Dashboard'
import MiCarrera from './pages/MiCarrera'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mi-carrera" element={<MiCarrera />} />

          {/* Plan de Estudios, Historial Académico y Ruta Crítica eran tres
              pantallas separadas; ahora son el mapa, el panel de cada
              materia y un botón dentro de Mi Carrera. Las rutas viejas se
              mantienen redirigidas para no romperle el enlace a nadie que
              las tuviera guardadas. */}
          <Route path="/plan-de-estudios" element={<Navigate to="/mi-carrera" replace />} />
          <Route path="/historial" element={<Navigate to="/mi-carrera" replace />} />
          <Route path="/ruta-critica" element={<Navigate to="/mi-carrera" replace />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
      </Route>
    </Routes>
  )
}

export default App
