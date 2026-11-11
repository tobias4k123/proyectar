import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus } from 'lucide-react'
import * as api from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'
import ModalCorrelatividad from './ModalCorrelatividad'

const TIPO_LABEL = { cursar: 'Para cursar', final: 'Para el final' }
const REQUIERE_LABEL = { cursada: 'cursada', aprobada: 'aprobada' }

// Mismo criterio que en la pestaña de materias: botones de 40px en celular,
// 32px desde `sm`, y la lista apilada en pantallas chicas en vez de una
// tabla cuya última columna quedaba fuera de pantalla.
const BOTON_ICONO =
  'inline-flex items-center justify-center min-h-10 min-w-10 sm:min-h-8 sm:min-w-8 rounded-md border border-slate-300 dark:border-slate-700'
const COLUMNAS = 'sm:grid-cols-[minmax(0,1fr)_12rem_minmax(0,1fr)_auto]'

function TabCorrelatividades({ materiasQuery }) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [error, setError] = useState(null)

  const correlatividadesQuery = useQuery({
    queryKey: ['admin', 'correlatividades'],
    queryFn: () => api.listarCorrelatividadesAdmin(token),
    enabled: Boolean(token),
  })

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'correlatividades'] })
    queryClient.invalidateQueries({ queryKey: ['grafo'] })
  }

  const eliminar = useMutation({
    mutationFn: (id) => api.eliminarCorrelatividad(token, id),
    onSuccess: () => {
      setError(null)
      invalidar()
    },
    onError: (err) => setError(err.message),
  })

  function nombreDe(materiaId) {
    const materia = (materiasQuery.data ?? []).find((m) => m.id === materiaId)
    return materia ? `${materia.nombre} (${materia.codigo})` : `#${materiaId}`
  }

  function borrar(correlatividad) {
    const confirmado = window.confirm(
      `¿Borrar la correlatividad "${nombreDe(correlatividad.materia_id)} necesita ${
        REQUIERE_LABEL[correlatividad.requiere]
      } ${nombreDe(correlatividad.correlativa_id)}"?`,
    )
    if (!confirmado) return
    setError(null)
    eliminar.mutate(correlatividad.id)
  }

  const correlatividades = correlatividadesQuery.data ?? []
  const materiasDisponibles = materiasQuery.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{correlatividades.length} correlatividades cargadas</p>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          disabled={materiasDisponibles.length < 2}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 dark:bg-slate-100 px-3 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={15} aria-hidden="true" />
          Nueva correlatividad
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-3 text-sm text-[#d03b3b] dark:text-[#f87171]">
          {error}
        </div>
      )}

      {correlatividadesQuery.isLoading && (
        <div className="flex h-40 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">
          Cargando correlatividades…
        </div>
      )}

      {correlatividadesQuery.isError && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-4 text-sm text-[#d03b3b] dark:text-[#f87171]">
          No se pudieron cargar las correlatividades: {correlatividadesQuery.error.message}
        </div>
      )}

      {correlatividadesQuery.data && (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div
            className={`hidden sm:grid gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 ${COLUMNAS}`}
          >
            <span>Materia</span>
            <span>Necesita</span>
            <span>Correlativa</span>
            <span className="text-right">Acciones</span>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {correlatividades.map((correlatividad) => (
              <li
                key={correlatividad.id}
                data-admin-correlatividad={correlatividad.id}
                className={`grid grid-cols-1 gap-1 px-4 py-3 text-sm sm:items-center sm:gap-4 ${COLUMNAS}`}
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {nombreDe(correlatividad.materia_id)}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {TIPO_LABEL[correlatividad.tipo]}: {REQUIERE_LABEL[correlatividad.requiere]}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {nombreDe(correlatividad.correlativa_id)}
                </span>
                <div className="mt-1 flex sm:mt-0 sm:justify-end">
                  <button
                    type="button"
                    disabled={eliminar.isPending}
                    onClick={() => borrar(correlatividad)}
                    className={`${BOTON_ICONO} text-[#d03b3b] dark:text-[#f87171] hover:bg-[#d03b3b]/5 disabled:cursor-not-allowed disabled:opacity-60`}
                    title="Borrar"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
            {correlatividades.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                Todavía no hay correlatividades cargadas.
              </li>
            )}
          </ul>
        </div>
      )}

      {modalAbierto && (
        <ModalCorrelatividad
          materias={materiasDisponibles}
          onCerrar={() => setModalAbierto(false)}
          onGuardado={() => {
            setModalAbierto(false)
            invalidar()
          }}
        />
      )}
    </div>
  )
}

export default TabCorrelatividades
