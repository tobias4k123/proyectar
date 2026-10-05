import { MarkerType } from '@xyflow/react'

const COLUMN_WIDTH = 300
const ROW_HEIGHT = 110
const PASADAS_DE_ORDENAMIENTO = 4
const COLOR_DEFAULT = '#898781'
const COLOR_RUTA_CRITICA = '#ea6c1f'

// Reordena las materias dentro de cada columna (año) para minimizar
// cuántas líneas se cruzan con las columnas vecinas, usando el método
// clásico del "baricentro": la fila de una materia se calcula como el
// promedio de fila de sus correlativas en la columna de al lado, y se
// ordena por eso. Se hacen varias pasadas de ida y vuelta porque
// reordenar una columna cambia el baricentro de las columnas vecinas.
//
// El año de cada materia queda fijo (es información real del plan, no
// algo para que decida un algoritmo) -- lo único que se reacomoda es el
// orden vertical dentro de cada año.
function ordenarPorCrucesMinimos(columnas, vecinosPorMateria) {
  const filaDeMateria = new Map()
  columnas.forEach((columna) => columna.forEach((id, fila) => filaDeMateria.set(id, fila)))

  function reordenarColumna(columna, columnaVecina) {
    if (!columnaVecina) return columna
    const idsVecina = new Set(columnaVecina)
    const baricentroDe = (id) => {
      const vecinos = (vecinosPorMateria.get(id) ?? []).filter((v) => idsVecina.has(v))
      if (vecinos.length === 0) return filaDeMateria.get(id)
      return vecinos.reduce((acc, v) => acc + filaDeMateria.get(v), 0) / vecinos.length
    }
    const nuevoOrden = columna
      .map((id) => ({ id, baricentro: baricentroDe(id) }))
      .sort((a, b) => a.baricentro - b.baricentro)
      .map(({ id }) => id)
    nuevoOrden.forEach((id, fila) => filaDeMateria.set(id, fila))
    return nuevoOrden
  }

  let resultado = columnas.map((columna) => [...columna])
  for (let pasada = 0; pasada < PASADAS_DE_ORDENAMIENTO; pasada++) {
    for (let i = 1; i < resultado.length; i++) {
      resultado[i] = reordenarColumna(resultado[i], resultado[i - 1])
    }
    for (let i = resultado.length - 2; i >= 0; i--) {
      resultado[i] = reordenarColumna(resultado[i], resultado[i + 1])
    }
  }
  return resultado
}

// Convierte la respuesta real de GET /grafo (o GET /grafo/simulacion)
// ({ nodos, aristas }) en nodes/edges de React Flow. Una columna por año de
// la carrera (fijo), y dentro de cada columna el orden lo decide
// `ordenarPorCrucesMinimos` en vez de ser simplemente el orden en que vino
// la materia del backend.
//
// `rutaCriticaIds` es la lista ordenada de materia_id que devuelve el
// backend como la cadena más larga de materias pendientes (ruta crítica):
// si se pasa, se resaltan tanto esos nodos como los tramos de arista que
// unen pasos consecutivos de esa cadena.
export function construirGrafo({ nodos, aristas, rutaCriticaIds = [] }) {
  const idsEnRutaCritica = new Set(rutaCriticaIds)
  const pasosRutaCritica = new Set()
  for (let i = 0; i < rutaCriticaIds.length - 1; i++) {
    pasosRutaCritica.add(`${rutaCriticaIds[i]}->${rutaCriticaIds[i + 1]}`)
  }

  const aniosOrdenados = [...new Set(nodos.map((m) => m.anio_carrera))].sort((a, b) => a - b)
  const idsPorAnio = new Map(aniosOrdenados.map((anio) => [anio, []]))
  for (const materia of nodos) {
    idsPorAnio.get(materia.anio_carrera).push(materia.materia_id)
  }

  // Vecinos sin distinguir tipo ni dirección: para acomodar filas alcanza
  // con saber qué materias están conectadas entre sí.
  const vecinosPorMateria = new Map()
  const agregarVecino = (a, b) => {
    if (!vecinosPorMateria.has(a)) vecinosPorMateria.set(a, [])
    vecinosPorMateria.get(a).push(b)
  }
  for (const arista of aristas) {
    agregarVecino(arista.origen_id, arista.destino_id)
    agregarVecino(arista.destino_id, arista.origen_id)
  }

  const columnas = aniosOrdenados.map((anio) => idsPorAnio.get(anio))
  const columnasOrdenadas = ordenarPorCrucesMinimos(columnas, vecinosPorMateria)

  // Las columnas con menos materias quedan centradas respecto a la más
  // larga, en vez de todas pegadas arriba.
  const maxFilas = Math.max(...columnasOrdenadas.map((columna) => columna.length))
  const posicionPorMateria = new Map()
  columnasOrdenadas.forEach((columna, indiceColumna) => {
    const offsetVertical = ((maxFilas - columna.length) / 2) * ROW_HEIGHT
    columna.forEach((id, fila) => {
      posicionPorMateria.set(id, {
        x: indiceColumna * COLUMN_WIDTH,
        y: offsetVertical + fila * ROW_HEIGHT,
      })
    })
  })

  const nodes = nodos.map((materia) => ({
    id: String(materia.materia_id),
    type: 'materia',
    position: posicionPorMateria.get(materia.materia_id),
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
  }))

  // tipo 'cursar' -> línea sólida; tipo 'final' -> línea punteada. Se
  // distinguen por trazo, no solo por color, para que sea legible incluso
  // sin distinguir bien los grises. Curvas (bezier) en vez de en ángulo
  // recto: con tantas correlativas cruzándose, las curvas se siguen con la
  // vista mucho más fácil que los quiebres de 90°. Un tramo que forma parte
  // de la ruta crítica se resalta en naranja y más grueso, además del color.
  const edges = aristas.map((arista) => {
    const esFinal = arista.tipo === 'final'
    const esPasoCritico = pasosRutaCritica.has(`${arista.origen_id}->${arista.destino_id}`)
    const color = esPasoCritico ? COLOR_RUTA_CRITICA : COLOR_DEFAULT

    return {
      id: `${arista.origen_id}-${arista.tipo}-${arista.destino_id}`,
      source: String(arista.origen_id),
      target: String(arista.destino_id),
      type: 'default',
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
