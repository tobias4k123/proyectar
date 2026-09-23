// Cliente mínimo para hablar con el backend de ProyectAR (FastAPI).
// URL configurable por variable de entorno: en Docker la inyecta
// docker-compose (VITE_API_URL=http://localhost:8000); corriendo el
// frontend suelto con `npm run dev`, se toma de .env / .env.local.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function manejarRespuesta(response) {
  if (!response.ok) {
    let detalle = 'Ocurrió un error inesperado. Intentá de nuevo.'
    try {
      const cuerpo = await response.json()
      if (cuerpo?.detail) detalle = cuerpo.detail
    } catch {
      // el cuerpo no era JSON válido; nos quedamos con el mensaje genérico
    }
    throw new Error(detalle)
  }
  // DELETE /alumnos/me/historial/{id} responde 204 sin cuerpo -- no hay
  // nada que parsear como JSON.
  if (response.status === 204) return null
  return response.json()
}

// POST /auth/login espera x-www-form-urlencoded (OAuth2PasswordRequestForm),
// con el email en el campo "username".
export async function login(email, password) {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  return manejarRespuesta(response)
}

export async function registrar(nombre, email, password) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password }),
  })
  return manejarRespuesta(response)
}

export async function obtenerUsuarioActual(token) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return manejarRespuesta(response)
}

export async function obtenerGrafo(token) {
  const response = await fetch(`${API_URL}/grafo`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return manejarRespuesta(response)
}

export async function obtenerDashboard(token) {
  const response = await fetch(`${API_URL}/alumnos/me/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return manejarRespuesta(response)
}

// Carga o corrige el estado de una materia en el historial del alumno.
// `nota` solo hace falta cuando `estado` es "aprobada" (1 a 10).
export async function actualizarHistorial(token, { materia_id, estado, nota }) {
  const response = await fetch(`${API_URL}/alumnos/me/historial`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ materia_id, estado, nota }),
  })
  return manejarRespuesta(response)
}

// Deshace la carga de una materia (vuelve a "sin cursar"), sin importar
// en qué estado esté -- es la forma de corregir un error de carga.
export async function eliminarHistorial(token, materiaId) {
  const response = await fetch(`${API_URL}/alumnos/me/historial/${materiaId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return manejarRespuesta(response)
}
