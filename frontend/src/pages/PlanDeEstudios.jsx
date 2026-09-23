import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import * as api from '../lib/apiClient'
import { useAuthStore } from '../store/useAuthStore'
import { construirGrafo } from '../lib/layoutMaterias'
import MateriaNode from '../components/graph/MateriaNode'
import EstadoLegend from '../components/graph/EstadoLegend'

const nodeTypes = { materia: MateriaNode }

function PlanDeEstudios() {
  const token = useAuthStore((state) => state.token)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['grafo'],
    queryFn: () => api.obtenerGrafo(token),
    enabled: Boolean(token),
  })

  const { nodes, edges } = useMemo(
    () => (data ? construirGrafo(data) : { nodes: [], edges: [] }),
    [data],
  )

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Plan de Estudios</h1>
        <p className="text-slate-600">
          Estado real de tus materias y correlatividades, calculado por el
          backend a partir de tu historial académico.
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
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={24} color="#e1e0d9" />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable className="!bg-white" />
            </ReactFlow>
          </div>
        </>
      )}
    </section>
  )
}

export default PlanDeEstudios
