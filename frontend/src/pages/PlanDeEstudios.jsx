import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReactFlow, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import * as api from '../lib/apiClient'
import { useAuthStore } from '../store/useAuthStore'
import { construirGrafo } from '../lib/layoutMaterias'
import { aplicarFoco } from '../lib/aplicarFoco'
import MateriaNode from '../components/graph/MateriaNode'
import EstadoLegend from '../components/graph/EstadoLegend'

const nodeTypes = { materia: MateriaNode }

function PlanDeEstudios() {
  const token = useAuthStore((state) => state.token)
  const [seleccionId, setSeleccionId] = useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['grafo'],
    queryFn: () => api.obtenerGrafo(token),
    enabled: Boolean(token),
  })

  const { nodes: nodesBase, edges: edgesBase } = useMemo(
    () => (data ? construirGrafo(data) : { nodes: [], edges: [] }),
    [data],
  )

  const { nodes, edges } = useMemo(
    () => aplicarFoco(nodesBase, edgesBase, seleccionId),
    [nodesBase, edgesBase, seleccionId],
  )

  const alClickearMateria = useCallback((_event, nodo) => {
    setSeleccionId((actual) => (actual === nodo.id ? null : nodo.id))
  }, [])

  const alClickearFondo = useCallback(() => setSeleccionId(null), [])

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Plan de Estudios</h1>
        <p className="text-slate-600">
          Estado real de tus materias y correlatividades, calculado por el
          backend a partir de tu historial académico. Tocá una materia para
          resaltar sus correlativas.
        </p>
      </div>

      {isLoading && (
        <div className="flex h-96 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
          Cargando plan de estudios…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-4 text-sm text-[#d03b3b]">
          No se pudo cargar el plan de estudios: {error.message}
        </div>
      )}

      {data && (
        <>
          <EstadoLegend />
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
              // La rueda del mouse desplaza el gráfico (como un mapa) en vez
              // de hacer zoom -- el zoom queda para el pellizco de trackpad
              // o Ctrl+rueda, que es como se espera que se comporte esto hoy
              // en día.
              panOnScroll
              zoomOnScroll={false}
              zoomOnPinch
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={24} color="#e1e0d9" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </>
      )}
    </section>
  )
}

export default PlanDeEstudios
