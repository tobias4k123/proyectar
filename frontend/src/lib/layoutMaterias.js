import { MarkerType } from '@xyflow/react'

const COLUMN_WIDTH = 300
const ROW_HEIGHT = 120

// Convierte la respuesta real de GET /grafo ({ nodos, aristas }) en
// nodes/edges de React Flow. Layout simple: una columna por año de la
// carrera, una fila por materia dentro de ese año.
export function construirGrafo({ nodos, aristas }) {
  const filaPorAnio = {}

  const nodes = nodos.map((materia) => {
    const fila = filaPorAnio[materia.anio_carrera] ?? 0
    filaPorAnio[materia.anio_carrera] = fila + 1

    return {
      id: String(materia.materia_id),
      type: 'materia',
      position: {
        x: (materia.anio_carrera - 1) * COLUMN_WIDTH,
        y: fila * ROW_HEIGHT,
      },
      data: {
        nombre: materia.nombre,
        codigo: materia.codigo,
        anio: materia.anio_carrera,
        estado: materia.estado,
        puedeRendirFinal: materia.puede_rendir_final,
      },
    }
  })

  // tipo 'cursar' -> línea sólida; tipo 'final' -> línea punteada. Se
  // distinguen por trazo, no solo por color, para que sea legible incluso
  // sin distinguir bien los grises.
  const edges = aristas.map((arista) => {
    const esFinal = arista.tipo === 'final'
    return {
      id: `${arista.origen_id}-${arista.tipo}-${arista.destino_id}`,
      source: String(arista.origen_id),
      target: String(arista.destino_id),
      type: 'smoothstep',
      style: {
        stroke: '#898781',
        strokeWidth: 1.5,
        strokeDasharray: esFinal ? '4 3' : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#898781',
        width: 16,
        height: 16,
      },
    }
  })

  return { nodes, edges }
}
