// Calcula la posición de cada materia y el trazado de cada línea del mapa
// de "Mi Carrera".
//
// A diferencia del gráfico anterior (React Flow sobre un lienzo con
// desplazamiento y zoom), acá las coordenadas se calculan y el mapa entero
// se dibuja en pantalla: el alumno no tiene que descubrir que el gráfico se
// mueve. Como las posiciones son determinísticas, las líneas se dibujan en
// un <svg> con esas mismas coordenadas, sin tener que medir el DOM.

export const ANCHO_TARJETA = 190
export const ALTO_TARJETA = 78
export const SEPARACION_X = 70
export const SEPARACION_Y = 14
export const MARGEN = 16
export const ALTO_ENCABEZADO = 28

// La flecha termina un poco antes del borde de la tarjeta: el <svg> va
// detrás de las tarjetas, así que una punta que llegue justo al borde
// queda medio tapada.
const MARGEN_FLECHA = 3

function porCodigo(porId) {
  return (a, b) => porId.get(a).codigo.localeCompare(porId.get(b).codigo)
}

// Ordena las materias de un año de manera que una materia siempre quede
// debajo de sus correlativas del mismo año, y lo más cerca posible de
// ellas. Esto importa más de lo que parece: en el plan real 8 de las 11
// líneas del mapa son entre materias del mismo año, así que el orden es lo
// que decide si esas líneas son tramos cortos o curvas largas.
//
// Es un orden topológico recorrido en profundidad: apenas se emite una
// materia se intenta emitir a continuación las que dependen de ella y ya
// tienen todas sus correlativas arriba.
function ordenarAnio(ids, entrantesIntra, salientesIntra, porId) {
  const comparar = porCodigo(porId)
  const pendientes = new Set(ids)
  const emitidos = []
  const yaEmitida = new Set()

  const listaParaEmitir = (id) =>
    (entrantesIntra.get(id) ?? []).every((previa) => yaEmitida.has(previa))

  function emitir(id) {
    if (yaEmitida.has(id)) return
    emitidos.push(id)
    yaEmitida.add(id)
    pendientes.delete(id)
    for (const siguiente of [...(salientesIntra.get(id) ?? [])].sort(comparar)) {
      if (!yaEmitida.has(siguiente) && listaParaEmitir(siguiente)) emitir(siguiente)
    }
  }

  while (pendientes.size > 0) {
    const ordenadas = [...pendientes].sort(comparar)
    // El backend no permite ciclos, pero si alguna vez hubiera uno esto
    // igual termina (emite la primera que quede) en vez de colgarse.
    emitir(ordenadas.find(listaParaEmitir) ?? ordenadas[0])
  }

  return emitidos
}

function trazado(origen, destino) {
  const salidaDerechaX = origen.x + ANCHO_TARJETA
  const centroOrigenY = origen.y + ALTO_TARJETA / 2
  const centroDestinoY = destino.y + ALTO_TARJETA / 2

  // Años distintos: curva horizontal del borde derecho de la correlativa al
  // borde izquierdo de la materia que la exige.
  if (origen.columna !== destino.columna) {
    const hasta = destino.x - MARGEN_FLECHA
    const control = Math.max((hasta - salidaDerechaX) / 2, 20)
    return `M ${salidaDerechaX},${centroOrigenY} C ${salidaDerechaX + control},${centroOrigenY} ${
      hasta - control
    },${centroDestinoY} ${hasta},${centroDestinoY}`
  }

  // Mismo año y una justo debajo de la otra: un tramo vertical corto, que
  // es la forma más directa de leer "esta va antes que esta".
  const distanciaFilas = Math.abs(destino.fila - origen.fila)
  if (distanciaFilas === 1 && destino.fila > origen.fila) {
    const centroX = origen.x + ANCHO_TARJETA / 2
    return `M ${centroX},${origen.y + ALTO_TARJETA} L ${centroX},${destino.y - MARGEN_FLECHA}`
  }

  // Mismo año pero con materias en el medio: la línea se va por el costado
  // derecho, entre esta columna y la siguiente, en vez de pasar por encima
  // de las tarjetas intermedias.
  const desvio = Math.min(24 + distanciaFilas * 6, SEPARACION_X - 18)
  const hasta = salidaDerechaX + MARGEN_FLECHA
  return `M ${salidaDerechaX},${centroOrigenY} C ${salidaDerechaX + desvio},${centroOrigenY} ${
    salidaDerechaX + desvio
  },${centroDestinoY} ${hasta},${centroDestinoY}`
}

// Arma el mapa completo a partir del índice de `requisitos.js`.
export function construirMapa(indice) {
  const { nodos, aristas, porId, requierenTodo } = indice

  const anios = [...new Set(nodos.map((m) => m.anio_carrera))].sort((a, b) => a - b)
  const idsPorAnio = new Map(anios.map((anio) => [anio, []]))
  for (const materia of nodos) idsPorAnio.get(materia.anio_carrera).push(materia.materia_id)

  // Para ordenar cada año solo cuentan las dependencias internas de ese año,
  // y se ignoran las de las materias que exigen casi todo el plan (esas no
  // se dibujan, así que tampoco deberían condicionar el orden).
  const posiciones = new Map()
  anios.forEach((anio, columna) => {
    const idsDelAnio = idsPorAnio.get(anio)
    const delAnio = new Set(idsDelAnio)
    const entrantesIntra = new Map()
    const salientesIntra = new Map()
    for (const arista of aristas) {
      if (requierenTodo.has(arista.destino_id)) continue
      if (!delAnio.has(arista.origen_id) || !delAnio.has(arista.destino_id)) continue
      if (!entrantesIntra.has(arista.destino_id)) entrantesIntra.set(arista.destino_id, [])
      if (!salientesIntra.has(arista.origen_id)) salientesIntra.set(arista.origen_id, [])
      entrantesIntra.get(arista.destino_id).push(arista.origen_id)
      salientesIntra.get(arista.origen_id).push(arista.destino_id)
    }

    ordenarAnio(idsDelAnio, entrantesIntra, salientesIntra, porId).forEach((id, fila) => {
      posiciones.set(id, {
        columna,
        fila,
        x: MARGEN + columna * (ANCHO_TARJETA + SEPARACION_X),
        y: MARGEN + ALTO_ENCABEZADO + fila * (ALTO_TARJETA + SEPARACION_Y),
      })
    })
  })

  // Una sola línea por par de materias, aunque existan las dos
  // correlatividades (la de cursada y la del final): el detalle de qué pide
  // cada una se lee en el panel, no en el dibujo.
  const porPar = new Map()
  for (const arista of aristas) {
    if (requierenTodo.has(arista.destino_id)) continue
    if (!posiciones.has(arista.origen_id) || !posiciones.has(arista.destino_id)) continue
    const clave = `${arista.origen_id}-${arista.destino_id}`
    if (!porPar.has(clave)) {
      porPar.set(clave, { id: clave, origenId: arista.origen_id, destinoId: arista.destino_id })
    }
  }

  const conexiones = [...porPar.values()].map((conexion) => ({
    ...conexion,
    d: trazado(posiciones.get(conexion.origenId), posiciones.get(conexion.destinoId)),
  }))

  const filasMaximas = Math.max(...anios.map((anio) => idsPorAnio.get(anio).length), 1)

  return {
    columnas: anios.map((anio, columna) => ({
      anio,
      x: MARGEN + columna * (ANCHO_TARJETA + SEPARACION_X),
    })),
    materias: nodos
      .filter((materia) => posiciones.has(materia.materia_id))
      .map((materia) => ({ materia, ...posiciones.get(materia.materia_id) })),
    conexiones,
    ancho: MARGEN * 2 + anios.length * ANCHO_TARJETA + (anios.length - 1) * SEPARACION_X,
    alto:
      MARGEN * 2 +
      ALTO_ENCABEZADO +
      filasMaximas * ALTO_TARJETA +
      (filasMaximas - 1) * SEPARACION_Y,
  }
}
