import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Persiste el token en localStorage para no perder la sesión al refrescar
// la página. El backend usa JWT sin estado, así que no hay "logout" real
// del lado del servidor más allá de descartar el token acá.
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,
      setSesion: (token, usuario) => set({ token, usuario, isAuthenticated: true }),
      logout: () => set({ token: null, usuario: null, isAuthenticated: false }),
    }),
    { name: 'proyectar-auth' },
  ),
)
