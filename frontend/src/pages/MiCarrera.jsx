import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { FlaskConical, LayoutGrid, List, Route, RotateCcw } from 'lucide-react'
import * as api from '../lib/apiClient'
import { useAuthStore } from '../store/useAuthStore'
import { ESTADO_CONFIG } from '../lib/estados'
import { descendientesDe, indexarGrafo } from '../lib/requisitos'
import MapaMaterias from '../components/mapa/MapaMaterias'
import ListaMaterias from '../components/mapa/ListaMaterias'
import PanelMateria from '../components/mapa/PanelMateria'

// "Mi Carrera" reúne en una sola pantalla lo que antes estaba repartido
// entre Plan de Estudios (el mapa), Historial Académico (cargar el estado
// de cada materia) y Ruta Crítica/Simulador: se toca una materia y todo lo
// suyo aparece al costado, y las dos vistas extra son interruptores sobre
// el mismo mapa en vez de pantallas aparte.
//
// Los datos salen siempre de GET /grafo/simulacion, que con la lista de
// materias simuladas vacía devuelve exactamente el grafo real más la ruta
// crítica ya calculada: así alcanza una sola consulta para las tres cosas.
function MiCarrera() {
  const token = useAuthStore((state) => state.token)
  const [seleccionId, setSeleccionId] = useState(null)
  const [vista, setVista] = useState('mapa')
  const [mostrarRutaCritica, setMostrarRutaCritica] = useState(false)
  const [modoSimulacion, setModoSimulacion] = useState(false)
  const [simuladas, setSimuladas] = useState([])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['simulacion', simuladas],
    queryFn: () => api.simularGrafo(token, simuladas),
    enabled: Boolean(token),
    // Al marcar una materia en el simulador cambia la clave de la consulta.
    // Sin esto el mapa desaparecería mientras llega la respuesta, la
    // pantalla se vaciaría y el navegador saltaría al tope: se queda con
    // los datos anteriores hasta que estén los nuevos.
    placeholderData: keepPreviousData,
  })

  const indice = useMemo(() => (data ? indexarGrafo(data) : null), [data])
  const rutaCritica = useMemo(() => data?.ruta_critica ?? [], [data])
  const rutaCriticaIds = useMemo(
    () => (mostrarRutaCritica ? rutaCritica.map((materia) => materia.materia_id) : []),
    [mostrarRutaCritica, rutaCritica],
  )
  const seleccionada = indice && seleccionId ? indice.porId.get(seleccionId) : null

  useEffect(() => {
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') setSeleccionId(null)
    }
    window.addEventListener('keydown', alPresionarTecla)
    return () => window.removeEventListener('keydown', alPresionarTecla)
  }, [])

  // En modo simulación el clic cambia de significado: marca o desmarca la
  // materia como aprobada "de mentira" en vez de abrir su panel.
  function alTocarMateria(materiaId) {
    if (!modoSimulacion) {
      setSeleccionId((actual) => (actual === materiaId ? null : materiaId))
      return
    }

    const materia = indice?.porId.get(materiaId)
    if (!materia) return

    if (materia.simulado) {
      // Al dejar de dar por aprobada una materia también se caen las que
      // se habían habilitado gracias a ella: si no, quedarían aprobadas
      // sin cumplir sus correlatividades, que es justo lo que el simulador
      // tiene que mostrar bien.
      const seCaen = descendientesDe(indice, materiaId)
      setSimuladas((previas) =>
        previas.filter((id) => id !== materiaId && !seCaen.has(id)),
      )
      return
    }

    // Solo se puede simular lo que hoy se podría cursar de verdad. Una
    // materia bloqueada no se toca hasta que se marque su correlativa.
    if (materia.estado === 'bloqueada' || materia.estado === 'aprobada') return
    setSimuladas((previas) => [...previas, materiaId])
  }

  function alternarSimulacion() {
    setModoSimulacion((activo) => {
      if (activo) setSimuladas([])
      else setSeleccionId(null)
      return !activo
    })
  }

  function cambiarVista(nueva) {
    setVista(nueva)
    // La lista no tiene dónde simular: el clic ahí carga el historial real.
    if (nueva === 'lista' && modoSimulacion) {
      setModoSimulacion(false)
      setSimuladas([])
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mi Carrera</h1>
        <p className="text-slate-600">
          Tu plan de estudios completo. Tocá una materia para ver qué necesita, qué habilita y
          cargar cómo venís con ella.
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-slate-300 p-0.5">
              <BotonVista
                activo={vista === 'mapa'}
                onClick={() => cambiarVista('mapa')}
                icono={LayoutGrid}
                etiqueta="Mapa"
              />
              <BotonVista
                activo={vista === 'lista'}
                onClick={() => cambiarVista('lista')}
                icono={List}
                etiqueta="Lista"
              />
            </div>

            <BotonCapa
              activo={mostrarRutaCritica}
              onClick={() => setMostrarRutaCritica((activo) => !activo)}
              icono={Route}
              color="#ea6c1f"
              etiqueta="Ruta crítica"
            />

            {vista === 'mapa' && (
              <BotonCapa
                activo={modoSimulacion}
                onClick={alternarSimulacion}
                icono={FlaskConical}
                color="#7c5fe0"
                etiqueta="Simular"
              />
            )}
          </div>

          {vista === 'mapa' && <Leyenda mostrarRutaCritica={mostrarRutaCritica} />}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              {vista === 'mapa' ? (
                <MapaMaterias
                  indice={indice}
                  seleccionId={seleccionId}
                  rutaCriticaIds={rutaCriticaIds}
                  simuladasIds={simuladas}
                  modoSimulacion={modoSimulacion}
                  onSeleccionar={alTocarMateria}
                />
              ) : (
                <ListaMaterias
                  indice={indice}
                  rutaCriticaIds={rutaCriticaIds}
                  onSeleccionar={(materiaId) => {
                    setVista('mapa')
                    setSeleccionId(materiaId)
                  }}
                />
              )}
            </div>

            <div className="w-full space-y-4 lg:w-80 lg:shrink-0">
              {modoSimulacion && (
                <PanelSimulacion
                  cantidad={simuladas.length}
                  onLimpiar={() => setSimuladas([])}
                  onSalir={alternarSimulacion}
                />
              )}

              {mostrarRutaCritica && (
                <PanelRutaCritica materias={rutaCritica} simulando={simuladas.length > 0} />
              )}

              {!modoSimulacion &&
                (seleccionada ? (
                  <PanelMateria
                    key={seleccionada.materia_id}
                    indice={indice}
                    materia={seleccionada}
                    enRutaCritica={rutaCriticaIds.includes(seleccionada.materia_id)}
                    onCerrar={() => setSeleccionId(null)}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-400">
                    Tocá una materia para ver sus correlatividades y cargar su estado.
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function BotonVista({ activo, onClick, icono: Icono, etiqueta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium transition-colors ${
        activo ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icono size={14} aria-hidden="true" />
      {etiqueta}
    </button>
  )
}

function BotonCapa({ activo, onClick, icono: Icono, color, etiqueta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      style={activo ? { backgroundColor: color, borderColor: color } : undefined}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
        activo ? 'text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icono size={14} aria-hidden="true" />
      {etiqueta}
    </button>
  )
}

function PanelSimulacion({ cantidad, onLimpiar, onSalir }) {
  return (
    <div className="rounded-lg border border-[#7c5fe0]/40 bg-[#7c5fe0]/5 p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[#7c5fe0]">
        <FlaskConical size={15} aria-hidden="true" />
        Estás simulando
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
        Tocá materias en el mapa para darlas por aprobadas y ver cómo cambiaría todo.{' '}
        <strong className="font-medium text-slate-900">Nada de esto se guarda</strong> en tu
        historial.
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        Solo podés marcar las que ya podrías cursar. Las bloqueadas se habilitan recién cuando
        marcás su correlativa, y las flechas violetas muestran qué desbloqueó cada una.
      </p>
      <p className="mt-2 text-xs font-medium text-slate-900">
        {cantidad === 0
          ? 'Todavía no marcaste ninguna.'
          : `${cantidad} ${cantidad === 1 ? 'materia simulada' : 'materias simuladas'}.`}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {cantidad > 0 && (
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={12} aria-hidden="true" />
            Empezar de nuevo
          </button>
        )}
        <button
          type="button"
          onClick={onSalir}
          className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          Salir de la simulación
        </button>
      </div>
    </div>
  )
}

function PanelRutaCritica({ materias, simulando }) {
  return (
    <div className="rounded-lg border border-[#ea6c1f]/40 bg-[#ea6c1f]/5 p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[#ea6c1f]">
        <Route size={15} aria-hidden="true" />
        Ruta crítica
      </h2>
      {materias.length === 0 ? (
        <p className="mt-1.5 text-xs text-slate-600">
          No te queda ninguna cadena de materias pendientes. ¡Terminaste el plan!
        </p>
      ) : (
        <>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            La cadena más larga que te queda por delante: {materias.length}{' '}
            {materias.length === 1 ? 'materia' : 'materias'}, una atrás de la otra.
            {simulando && ' Recalculada con tu simulación.'}
          </p>
          <ol className="mt-2 space-y-1">
            {materias.map((materia, posicion) => (
              <li
                key={materia.materia_id}
                className="flex items-start gap-2 text-xs text-slate-700"
              >
                <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ea6c1f] text-[9px] font-semibold text-white">
                  {posicion + 1}
                </span>
                {materia.nombre}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

// Solo los estados: en este mapa las dos correlatividades de un mismo par
// (la de cursada y la del final) se dibujan como una sola línea, así que no
// hay nada que distinguir por tipo de trazo.
function Leyenda({ mostrarRutaCritica }) {
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
      {mostrarRutaCritica && (
        <span className="flex items-center gap-1.5 border-l border-slate-200 pl-4 text-[#ea6c1f]">
          <Route size={14} aria-hidden="true" />
          En la ruta crítica
        </span>
      )}
    </div>
  )
}

export default MiCarrera
