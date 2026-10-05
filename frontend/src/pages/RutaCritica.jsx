import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReactFlow, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Route, FlaskConical, RotateCcw } from 'lucide-react'
import * as api from '../lib/apiClient'
import { useAuthStore } from '../store/useAuthStore'
import { construirGrafo } from '../lib/layoutMaterias'
import { aplicarFoco } from '../lib/aplicarFoco'
import { configDeEstado } from '../lib/estados'
import MateriaNode from '../components/graph/MateriaNode'
import EstadoLegend from '../components/graph/EstadoLegend'

const nodeTypes = { materia: MateriaNode }

function RutaCritica() {
  const token = useAuthStore((state) => state.token)
  // Materias que el alumno eligió simular como aprobadas, sin tocar su
  // historial real. Vacío = ruta crítica sobre el estado real actual.
  const [seleccionadas, setSeleccionadas] = useState([])
  // Materia clickeada en el gráfico para "modo foco" (ver aplicarFoco) --
  // independiente de la simulación, es solo para resaltar correlativas.
  const [seleccionId, setSeleccionId] = useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['simulacion', seleccionadas],
    queryFn: () => api.simularGrafo(token, seleccionadas),
    enabled: Boolean(token),
  })

  const rutaCriticaIds = useMemo(
    () => (data ? data.ruta_critica.map((materia) => materia.materia_id) : []),
    [data],
  )

  const { nodes: nodesBase, edges: edgesBase } = useMemo(
    () =>
      data
        ? construirGrafo({ nodos: data.nodos, aristas: data.aristas, rutaCriticaIds })
        : { nodes: [], edges: [] },
    [data, rutaCriticaIds],
  )

  const { nodes, edges } = useMemo(
    () => aplicarFoco(nodesBase, edgesBase, seleccionId),
    [nodesBase, edgesBase, seleccionId],
  )

  const alClickearMateria = useCallback((_event, nodo) => {
    setSeleccionId((actual) => (actual === nodo.id ? null : nodo.id))
  }, [])

  const alClickearFondo = useCallback(() => setSeleccionId(null), [])

  const enSimulacion = seleccionadas.length > 0

  function alternarMateria(materiaId) {
    setSeleccionadas((prev) =>
      prev.includes(materiaId) ? prev.filter((id) => id !== materiaId) : [...prev, materiaId],
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Ruta Crítica y Simulador</h1>
          <p className="max-w-2xl text-slate-600">
            La ruta crítica es la cadena más larga de materias que todavía te
            faltan: si se atrasa alguna de esas, se atrasa toda la carrera.
            Marcá materias como "aprobadas de mentira" para simular escenarios
            sin tocar tu historial real, o tocá una materia del gráfico para
            resaltar sus correlativas.
          </p>
        </div>
        {enSimulacion && (
          <button
            type="button"
            onClick={() => setSeleccionadas([])}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Salir de la simulación
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex h-96 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
          Calculando ruta crítica…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-4 text-sm text-[#d03b3b]">
          No se pudo calcular la ruta crítica: {error.message}
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-md border border-[#ea6c1f]/30 bg-[#ea6c1f]/5 px-4 py-3 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-[#ea6c1f]">
              <Route size={16} aria-hidden="true" />
              Ruta crítica: {rutaCriticaIds.length} materia
              {rutaCriticaIds.length === 1 ? '' : 's'}
            </span>
            {enSimulacion && (
              <span className="flex items-center gap-1.5 font-medium text-[#7c5fe0]">
                <FlaskConical size={16} aria-hidden="true" />
                Simulando {seleccionadas.length} materia
                {seleccionadas.length === 1 ? '' : 's'} aprobada
                {seleccionadas.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <EstadoLegend mostrarRutaCritica />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
            <div className="h-[560px] rounded-lg border border-slate-200 bg-slate-50">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={alClickearMateria}
                onPaneClick={alClickearFondo}
                nodesDraggable={false}
                fitView
                minZoom={0.3}
                maxZoom={1.5}
                panOnScroll
                zoomOnScroll={false}
                zoomOnPinch
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={24} color="#e1e0d9" />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>

            <SelectorSimulacion
              nodos={data.nodos}
              seleccionadas={seleccionadas}
              onAlternar={alternarMateria}
            />
          </div>
        </>
      )}
    </section>
  )
}

function SelectorSimulacion({ nodos, seleccionadas, onAlternar }) {
  const porAnio = {}
  for (const materia of nodos) {
    if (!porAnio[materia.anio_carrera]) porAnio[materia.anio_carrera] = []
    porAnio[materia.anio_carrera].push(materia)
  }
  const anios = Object.keys(porAnio)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="flex max-h-[560px] flex-col gap-4 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Simular materias aprobadas</h2>
        <p className="mt-1 text-xs text-slate-500">
          Elegí materias para ver cómo cambiaría tu plan si las dieras por
          aprobadas, sin guardar nada en tu historial.
        </p>
      </div>

      {anios.map((anio) => (
        <div key={anio}>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {anio}° año
          </h3>
          <ul className="space-y-1">
            {porAnio[anio].map((materia) => {
              const yaAprobada = materia.estado === 'aprobada' && !materia.simulado
              const config = configDeEstado(materia.estado)
              return (
                <li key={materia.materia_id}>
                  <label
                    className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                      yaAprobada
                        ? 'cursor-not-allowed text-slate-400'
                        : 'cursor-pointer text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={yaAprobada || seleccionadas.includes(materia.materia_id)}
                      disabled={yaAprobada}
                      onChange={() => onAlternar(materia.materia_id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="flex-1 truncate">{materia.nombre}</span>
                    <span className={`text-[10px] font-medium ${config.text}`}>
                      {config.label}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default RutaCritica
