import { MarkerType } from '@xyflow/react'

const COLUMN_WIDTH = 300
const ROW_HEIGHT = 120
const COLOR_DEFAULT = '#898781'
const COLOR_RUTA_CRITICA = '#ea6c1f'

// Convierte la respuesta real de GET /grafo (o GET /grafo/simulacion)
// ({ nodos, aristas }) en nodes/edges de React Flow. Layout simple: una
// columna por año de la carrera, una fila por materia dentro de ese año.
//
// `rutaCriticaIds` es la lista ordenada de materia_id que devuelve el
// backend como la cadena más larga de materias pendientes (ruta crítica):
// si se pasa, se resaltan tanto esos nodos como los tramos de arista que
// unen pasos consecutivos de esa cadena.
export function construirGrafo({ nodos, aristas, rutaCriticaIds = [] }) {
  const filaPorAnio = {}
  const idsEnRutaCritica = new Set(rutaCriticaIds)

  const pasosRutaCritica = new Set()
  for (let i = 0; i < rutaCriticaIds.length - 1; i++) {
    pasosRutaCritica.add(`${rutaCriticaIds[i]}->${rutaCriticaIds[i + 1]}`)
  }

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
        puedePromocionar: materia.puede_promocionar,
        simulado: materia.simulado,
        enRutaCritica: idsEnRutaCritica.has(materia.materia_id),
      },
    }
  })

  // tipo 'cursar' -> línea sólida; tipo 'final' -> línea punteada. Se
  // distinguen por trazo, no solo por color, para que sea legible incluso
  // sin distinguir bien los grises. Un tramo que forma parte de la ruta
  // crítica se resalta en naranja y más grueso, además del color.
  const edges = aristas.map((arista) => {
    const esFinal = arista.tipo === 'final'
    const esPasoCritico = pasosRutaCritica.has(`${arista.origen_id}->${arista.destino_id}`)
    const color = esPasoCritico ? COLOR_RUTA_CRITICA : COLOR_DEFAULT

    return {
      id: `${arista.origen_id}-${arista.tipo}-${arista.destino_id}`,
      source: String(arista.origen_id),
      target: String(arista.destino_id),
      type: 'smoothstep',
      style: {
        stroke: color,
        strokeWidth: esPasoCritico ? 2.5 : 1.5,
        strokeDasharray: esFinal ? '4 3' : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 16,
        height: 16,
      },
      zIndex: esPasoCritico ? 1 : 0,
    }
  })

  return { nodes, edges }
}
