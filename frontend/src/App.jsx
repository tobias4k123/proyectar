import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import PlanDeEstudios from './pages/PlanDeEstudios'
import Historial from './pages/Historial'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plan-de-estudios" element={<PlanDeEstudios />} />
          <Route path="/historial" element={<Historial />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
      </Route>
    </Routes>
  )
}

export default App
