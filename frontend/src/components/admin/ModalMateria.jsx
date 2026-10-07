import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import * as api from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'

function ModalMateria({ materia, onCerrar, onGuardado }) {
  const token = useAuthStore((state) => state.token)
  const esEdicion = Boolean(materia)

  const [codigo, setCodigo] = useState(materia?.codigo ?? '')
  const [nombre, setNombre] = useState(materia?.nombre ?? '')
  const [anioCarrera, setAnioCarrera] = useState(materia?.anio_carrera ?? 1)

  const mutation = useMutation({
    mutationFn: () => {
      const body = { codigo, nombre, anio_carrera: Number(anioCarrera) }
      return esEdicion ? api.actualizarMateria(token, materia.id, body) : api.crearMateria(token, body)
    },
    onSuccess: onGuardado,
  })

  function handleSubmit(event) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {esEdicion ? 'Editar materia' : 'Nueva materia'}
          </h2>
          <button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="codigo" className="text-sm font-medium text-slate-700">
              Código
            </label>
            <input
              id="codigo"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

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
            <label htmlFor="anio" className="text-sm font-medium text-slate-700">
              Año de la carrera
            </label>
            <input
              id="anio"
              type="number"
              min={1}
              value={anioCarrera}
              onChange={(event) => setAnioCarrera(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

          {mutation.isError && <p className="text-sm text-[#d03b3b]">{mutation.error.message}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalMateria
