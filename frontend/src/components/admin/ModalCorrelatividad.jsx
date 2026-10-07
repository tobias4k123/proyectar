import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import * as api from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'

function ModalCorrelatividad({ materias, onCerrar, onGuardado }) {
  const token = useAuthStore((state) => state.token)

  const [materiaId, setMateriaId] = useState(materias[0]?.id ?? '')
  const [correlativaId, setCorrelativaId] = useState(materias[1]?.id ?? materias[0]?.id ?? '')
  const [tipo, setTipo] = useState('cursar')
  const [requiere, setRequiere] = useState('cursada')

  const mutation = useMutation({
    mutationFn: () =>
      api.crearCorrelatividad(token, {
        materia_id: Number(materiaId),
        correlativa_id: Number(correlativaId),
        tipo,
        requiere,
      }),
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
          <h2 className="text-lg font-semibold text-slate-900">Nueva correlatividad</h2>
          <button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-600">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="materia" className="text-sm font-medium text-slate-700">
              Materia
            </label>
            <select
              id="materia"
              value={materiaId}
              onChange={(event) => setMateriaId(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              required
            >
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre} ({materia.codigo})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="tipo" className="text-sm font-medium text-slate-700">
              Para
            </label>
            <select
              id="tipo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="cursar">Cursar</option>
              <option value="final">Rendir el final</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="requiere" className="text-sm font-medium text-slate-700">
              Necesita la correlativa
            </label>
            <select
              id="requiere"
              value={requiere}
              onChange={(event) => setRequiere(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="cursada">Cursada</option>
              <option value="aprobada">Aprobada</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="correlativa" className="text-sm font-medium text-slate-700">
              Correlativa
            </label>
            <select
              id="correlativa"
              value={correlativaId}
              onChange={(event) => setCorrelativaId(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              required
            >
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre} ({materia.codigo})
                </option>
              ))}
            </select>
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

export default ModalCorrelatividad
