const OPACIDAD_ARISTA_NORMAL = 0.35
const OPACIDAD_ARISTA_ATENUADA = 0.06
const OPACIDAD_ARISTA_RESALTADA = 1

// "Modo foco": con muchas correlativas mostrando todas las líneas a la vez
// el gráfico se vuelve ilegible. Por defecto las líneas quedan bien tenues
// (para tener una idea general de la densidad) y al clickear una materia se
// resaltan solo sus correlativas directas -- lo que necesita y lo que
// habilita -- atenuando todo lo demás. Compartido entre Plan de Estudios y
// Ruta Crítica/Simulador para no duplicar la lógica.
export function aplicarFoco(nodes, edges, seleccionId) {
  if (!seleccionId) {
    return {
      nodes: nodes.map((nodo) => ({
        ...nodo,
        data: { ...nodo.data, atenuado: false, seleccionado: false },
      })),
      edges: edges.map((arista) => ({
        ...arista,
        style: { ...arista.style, opacity: OPACIDAD_ARISTA_NORMAL },
      })),
    }
  }

  const conectados = new Set()
  edges.forEach((arista) => {
    if (arista.source === seleccionId) conectados.add(arista.target)
    if (arista.target === seleccionId) conectados.add(arista.source)
  })

  return {
    nodes: nodes.map((nodo) => ({
      ...nodo,
      data: {
        ...nodo.data,
        seleccionado: nodo.id === seleccionId,
        atenuado: nodo.id !== seleccionId && !conectados.has(nodo.id),
      },
    })),
    edges: edges.map((arista) => {
      const relacionada = arista.source === seleccionId || arista.target === seleccionId
      return {
        ...arista,
        style: {
          ...arista.style,
          opacity: relacionada ? OPACIDAD_ARISTA_RESALTADA : OPACIDAD_ARISTA_ATENUADA,
        },
        // Si la arista ya tenía prioridad visual (p. ej. es un tramo de la
        // ruta crítica) no se la bajamos solo porque el foco no la incluya.
        zIndex: relacionada ? 1 : (arista.zIndex ?? 0),
      }
    }),
  }
}
