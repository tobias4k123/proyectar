import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus } from 'lucide-react'
import * as api from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'
import ModalCorrelatividad from './ModalCorrelatividad'

const TIPO_LABEL = { cursar: 'Para cursar', final: 'Para el final' }
const REQUIERE_LABEL = { cursada: 'cursada', aprobada: 'aprobada' }

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
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <th className="px-4 py-2">Materia</th>
                <th className="px-4 py-2">Necesita</th>
                <th className="px-4 py-2">Correlativa</th>
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {correlatividades.map((correlatividad) => (
                <tr key={correlatividad.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {nombreDe(correlatividad.materia_id)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {TIPO_LABEL[correlatividad.tipo]}: {REQUIERE_LABEL[correlatividad.requiere]}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{nombreDe(correlatividad.correlativa_id)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={eliminar.isPending}
                      onClick={() => borrar(correlatividad)}
                      className="rounded-md border border-slate-300 dark:border-slate-700 p-1.5 text-[#d03b3b] dark:text-[#f87171] hover:bg-[#d03b3b]/5 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Borrar"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {correlatividades.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    Todavía no hay correlatividades cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
