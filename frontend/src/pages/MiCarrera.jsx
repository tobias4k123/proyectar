import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as api from '../lib/apiClient'
import { useAuthStore } from '../store/useAuthStore'
import { ESTADO_CONFIG } from '../lib/estados'
import { indexarGrafo } from '../lib/requisitos'
import MapaMaterias from '../components/mapa/MapaMaterias'
import PanelMateria from '../components/mapa/PanelMateria'

// "Mi Carrera" reúne en una sola pantalla lo que antes estaba repartido
// entre Plan de Estudios (el mapa) e Historial Académico (cargar el estado
// de cada materia): se toca una materia en el mapa y todo lo suyo --
// correlatividades, qué habilita, y los botones para cargar su estado --
// aparece al costado, sin cambiar de página.
function MiCarrera() {
  const token = useAuthStore((state) => state.token)
  const [seleccionId, setSeleccionId] = useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['grafo'],
    queryFn: () => api.obtenerGrafo(token),
    enabled: Boolean(token),
  })

  const indice = useMemo(() => (data ? indexarGrafo(data) : null), [data])
  const seleccionada = indice && seleccionId ? indice.porId.get(seleccionId) : null

  useEffect(() => {
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') setSeleccionId(null)
    }
    window.addEventListener('keydown', alPresionarTecla)
    return () => window.removeEventListener('keydown', alPresionarTecla)
  }, [])

  function alSeleccionar(materiaId) {
    setSeleccionId((actual) => (actual === materiaId ? null : materiaId))
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mi Carrera</h1>
        <p className="text-slate-600">
          Tu plan de estudios completo. Tocá una materia para ver qué necesita, qué habilita
          y cargar cómo venís con ella.
        </p>
      </div>

      {isLoading && (
        <div className="flex h-96 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
          Cargando tu carrera…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-4 text-sm text-[#d03b3b]">
          No se pudo cargar tu carrera: {error.message}
        </div>
      )}

      {indice && (
        <>
          <Leyenda />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <MapaMaterias
                indice={indice}
                seleccionId={seleccionId}
                onSeleccionar={alSeleccionar}
              />
            </div>
            <div className="w-full lg:w-80 lg:shrink-0">
              {seleccionada ? (
                <PanelMateria
                  key={seleccionada.materia_id}
                  indice={indice}
                  materia={seleccionada}
                  onCerrar={() => setSeleccionId(null)}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-400">
                  Tocá una materia del mapa para ver sus correlatividades y cargar su estado.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

// Solo los estados: en este mapa las dos correlatividades de un mismo par
// (la de cursada y la del final) se dibujan como una sola línea, así que no
// hay nada que distinguir por tipo de trazo.
function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
      {Object.values(ESTADO_CONFIG).map(({ label, icon: Icon, text }) => (
        <span key={label} className="flex items-center gap-1.5">
          <Icon size={14} className={text} aria-hidden="true" />
          {label}
        </span>
      ))}
      <span className="flex items-center gap-1.5 border-l border-slate-200 pl-4 text-slate-500">
        <svg width="24" height="8" aria-hidden="true">
          <line x1="0" y1="4" x2="16" y2="4" stroke="#cbd5e1" strokeWidth="2" />
          <path d="M 16 0 L 23 4 L 16 8 z" fill="#cbd5e1" />
        </svg>
        La flecha va de la correlativa a la materia que la necesita
      </span>
    </div>
  )
}

export default MiCarrera
