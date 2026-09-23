import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import * as api from '../lib/apiClient'
import { useAuthStore } from '../store/useAuthStore'

function Register() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const setSesion = useAuthStore((state) => state.setSesion)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async () => {
      await api.registrar(nombre, email, password)
      // El registro no devuelve token; iniciamos sesión enseguida para
      // no pedirle al usuario que cargue las credenciales dos veces.
      const { access_token } = await api.login(email, password)
      const usuario = await api.obtenerUsuarioActual(access_token)
      return { access_token, usuario }
    },
    onSuccess: ({ access_token, usuario }) => {
      setSesion(access_token, usuario)
      navigate('/')
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Crear cuenta</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="nombre" className="text-sm font-medium text-slate-700">
            Nombre
          </label>
          <input
            id="nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-[#d03b3b]">{mutation.error.message}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {mutation.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium text-slate-900 underline">
          Ingresá
        </Link>
      </p>
    </section>
  )
}

export default Register
