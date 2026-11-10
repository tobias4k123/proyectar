// Explica, en texto, por qué una materia está como está.
//
// Replica la regla que el backend aplica en `_cumple_requisitos`
// (backend/app/grafo.py): un requisito "aprobada" se cumple solo con la
// correlativa aprobada, y uno "cursada" se cumple con la correlativa
// regular o aprobada.
//
// IMPORTANTE: acá no se decide nada. Quién puede cursar o aprobar qué lo
// sigue resolviendo el backend, a través del campo `estado` de cada nodo y
// de `puede_promocionar` / `puede_rendir_final`. Esta réplica existe solo
// para poder decirle al alumno *qué le falta*, que es lo único que el
// gráfico por sí solo no alcanza a comunicar.

// Una materia como Práctica Profesionalizante II exige, para su final,
// todas las demás materias del plan: son 22 correlatividades que, dibujadas
// como líneas, cruzan el gráfico entero y lo vuelven ilegible. Cuando una
// materia pide más que esta proporción del plan, se la trata como "requiere
// casi todo" y se la explica con un cartel en vez de con líneas. Es un
// umbral y no el código de una materia concreta, porque un administrador
// puede cambiar las correlatividades desde la pantalla de administración.
export const UMBRAL_REQUIERE_TODO = 0.6

export function cumpleRequisito(estadoCorrelativa, requiere) {
  if (requiere === 'aprobada') return estadoCorrelativa === 'aprobada'
  return estadoCorrelativa === 'aprobada' || estadoCorrelativa === 'regular'
}

// Arma de una sola pasada los índices que necesitan tanto el mapa como el
// panel, para no recorrer las aristas una y otra vez en cada render.
export function indexarGrafo({ nodos = [], aristas = [] }) {
  const porId = new Map(nodos.map((materia) => [materia.materia_id, materia]))
  const entrantes = new Map()
  const salientes = new Map()

  for (const arista of aristas) {
    if (!porId.has(arista.origen_id) || !porId.has(arista.destino_id)) continue
    if (!entrantes.has(arista.destino_id)) entrantes.set(arista.destino_id, [])
    if (!salientes.has(arista.origen_id)) salientes.set(arista.origen_id, [])
    entrantes.get(arista.destino_id).push(arista)
    salientes.get(arista.origen_id).push(arista)
  }

  // Materias que exigen casi todo el plan (ver UMBRAL_REQUIERE_TODO).
  const requierenTodo = new Set()
  const minimo = UMBRAL_REQUIERE_TODO * Math.max(nodos.length - 1, 1)
  for (const [materiaId, lista] of entrantes) {
    const correlativasDistintas = new Set(lista.map((a) => a.origen_id))
    if (correlativasDistintas.size >= minimo) requierenTodo.add(materiaId)
  }

  return { nodos, aristas, porId, entrantes, salientes, requierenTodo }
}

// Requisitos de un tipo ('cursar' o 'final') para una materia, cada uno con
// la correlativa, qué exige de ella y si hoy se cumple.
export function requisitosDe(indice, materiaId, tipo) {
  return (indice.entrantes.get(materiaId) ?? [])
    .filter((arista) => arista.tipo === tipo)
    .map((arista) => {
      const correlativa = indice.porId.get(arista.origen_id)
      return {
        materia: correlativa,
        requiere: arista.requiere,
        cumple: cumpleRequisito(correlativa.estado, arista.requiere),
      }
    })
    .sort((a, b) => a.materia.nombre.localeCompare(b.materia.nombre))
}

// Todo lo que depende de esta materia, directa o indirectamente. Se usa al
// desmarcar una materia en el simulador: si dejo de dar por aprobada
// Programación I, tampoco tiene sentido seguir dando por aprobadas las que
// se habían habilitado gracias a ella.
export function descendientesDe(indice, materiaId) {
  const alcanzadas = new Set()
  const pendientes = [materiaId]
  while (pendientes.length > 0) {
    const actual = pendientes.pop()
    for (const arista of indice.salientes.get(actual) ?? []) {
      if (alcanzadas.has(arista.destino_id)) continue
      alcanzadas.add(arista.destino_id)
      pendientes.push(arista.destino_id)
    }
  }
  return alcanzadas
}

// Materias que esta habilita al aprobarse. Se dejan afuera las que exigen
// casi todo el plan: aparecerían en la lista de todas las materias y no
// aportarían nada.
export function desbloqueaA(indice, materiaId) {
  const vistas = new Set()
  return (indice.salientes.get(materiaId) ?? [])
    .filter((arista) => !indice.requierenTodo.has(arista.destino_id))
    .filter((arista) => {
      if (vistas.has(arista.destino_id)) return false
      vistas.add(arista.destino_id)
      return true
    })
    .map((arista) => indice.porId.get(arista.destino_id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}
