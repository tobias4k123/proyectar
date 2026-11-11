import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Plus } from 'lucide-react'
import * as api from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'
import ModalMateria from './ModalMateria'

// Los botones de ícono se tocan con el dedo en celular: 40px de lado, que
// es el mínimo cómodo, y 32px desde `sm` para arriba, donde hay mouse.
const BOTON_ICONO =
  'inline-flex items-center justify-center min-h-10 min-w-10 sm:min-h-8 sm:min-w-8 rounded-md border border-slate-300 dark:border-slate-700'

// La lista no es una tabla: en celular cada materia se apila en una sola
// columna y recién desde `sm` pasa a las cuatro (código · nombre · año ·
// acciones). Con una tabla, la columna de acciones quedaba cortada contra
// el borde y los botones de borrar eran inalcanzables en pantallas chicas.
const COLUMNAS = 'sm:grid-cols-[7rem_minmax(0,1fr)_4rem_auto]'

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
        <p className="text-sm text-slate-500 dark:text-slate-400">{materias.length} materias cargadas</p>
        <button
          type="button"
          onClick={() => setModal('crear')}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 dark:bg-slate-100 px-3 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
        >
          <Plus size={15} aria-hidden="true" />
          Nueva materia
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-3 text-sm text-[#d03b3b] dark:text-[#f87171]">
          {error}
        </div>
      )}

      {materiasQuery.isLoading && (
        <div className="flex h-40 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">
          Cargando materias…
        </div>
      )}

      {materiasQuery.isError && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-4 text-sm text-[#d03b3b] dark:text-[#f87171]">
          No se pudieron cargar las materias: {materiasQuery.error.message}
        </div>
      )}

      {materiasQuery.data && (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div
            className={`hidden sm:grid gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 ${COLUMNAS}`}
          >
            <span>Código</span>
            <span>Nombre</span>
            <span>Año</span>
            <span className="text-right">Acciones</span>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {materias.map((materia) => (
              <li
                key={materia.id}
                data-admin-materia={materia.id}
                className={`grid grid-cols-1 gap-2 px-4 py-3 text-sm sm:items-center sm:gap-4 ${COLUMNAS}`}
              >
                <span className="text-slate-500 dark:text-slate-400">{materia.codigo}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{materia.nombre}</span>
                <span className="text-slate-500 dark:text-slate-400">{materia.anio_carrera}° año</span>
                <div className="flex gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setModal(materia)}
                    className={`${BOTON_ICONO} text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800`}
                    title="Editar"
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={eliminar.isPending}
                    onClick={() => borrar(materia)}
                    className={`${BOTON_ICONO} text-[#d03b3b] dark:text-[#f87171] hover:bg-[#d03b3b]/5 disabled:cursor-not-allowed disabled:opacity-60`}
                    title="Borrar"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
            {materias.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                Todavía no hay materias cargadas.
              </li>
            )}
          </ul>
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
