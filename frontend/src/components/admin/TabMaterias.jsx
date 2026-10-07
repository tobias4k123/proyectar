import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Plus } from 'lucide-react'
import * as api from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'
import ModalMateria from './ModalMateria'

function TabMaterias({ materiasQuery }) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'crear' | materia a editar
  const [error, setError] = useState(null)

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'materias'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'correlatividades'] })
    // las materias también afectan al gráfico del alumno
    queryClient.invalidateQueries({ queryKey: ['grafo'] })
  }

  const eliminar = useMutation({
    mutationFn: (materiaId) => api.eliminarMateria(token, materiaId),
    onSuccess: () => {
      setError(null)
      invalidar()
    },
    onError: (err) => setError(err.message),
  })

  function borrar(materia) {
    const confirmado = window.confirm(
      `¿Borrar la materia "${materia.nombre}" (${materia.codigo})? Esta acción no se puede deshacer.`,
    )
    if (!confirmado) return
    setError(null)
    eliminar.mutate(materia.id)
  }

  const materias = materiasQuery.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{materias.length} materias cargadas</p>
        <button
          type="button"
          onClick={() => setModal('crear')}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus size={15} aria-hidden="true" />
          Nueva materia
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-3 text-sm text-[#d03b3b]">
          {error}
        </div>
      )}

      {materiasQuery.isLoading && (
        <div className="flex h-40 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
          Cargando materias…
        </div>
      )}

      {materiasQuery.isError && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-4 text-sm text-[#d03b3b]">
          No se pudieron cargar las materias: {materiasQuery.error.message}
        </div>
      )}

      {materiasQuery.data && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Año</th>
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((materia) => (
                <tr key={materia.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-500">{materia.codigo}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{materia.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{materia.anio_carrera}°</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModal(materia)}
                        className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50"
                        title="Editar"
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={eliminar.isPending}
                        onClick={() => borrar(materia)}
                        className="rounded-md border border-slate-300 p-1.5 text-[#d03b3b] hover:bg-[#d03b3b]/5 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Borrar"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {materias.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Todavía no hay materias cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ModalMateria
          materia={modal === 'crear' ? null : modal}
          onCerrar={() => setModal(null)}
          onGuardado={() => {
            setModal(null)
            invalidar()
          }}
        />
      )}
    </div>
  )
}

export default TabMaterias
