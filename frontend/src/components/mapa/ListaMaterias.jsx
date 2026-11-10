import { Route } from 'lucide-react'
import { configDeEstado } from '../../lib/estados'
import AccionesMateria from './AccionesMateria'

// La misma información del mapa, agrupada por año. Sirve para dos cosas:
// cargar varias materias seguidas sin ir y volver del mapa al panel, y ser
// la alternativa legible para quien no saque nada de un diagrama.
//
// Las acciones son las mismas de `AccionesMateria`, el componente que usa
// también el panel: la máquina de estados vive en un solo lugar.
//
// No es una tabla. En una tabla de tres columnas los nombres largos se
// parten en cuatro renglones apenas la pantalla baja de 640px y los botones
// quedan contra el borde. Acá cada materia es una grilla que arranca en una
// sola columna (celular) y pasa a tres (nombre · estado · acciones) recién
// cuando hay ancho para las tres.
const COLUMNAS = 'sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)]'

function ListaMaterias({ indice, rutaCriticaIds = [], onSeleccionar }) {
  const enRutaCritica = new Set(rutaCriticaIds)

  const porAnio = new Map()
  for (const materia of indice.nodos) {
    if (!porAnio.has(materia.anio_carrera)) porAnio.set(materia.anio_carrera, [])
    porAnio.get(materia.anio_carrera).push(materia)
  }
  const anios = [...porAnio.keys()].sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      {anios.map((anio) => (
        <section
          key={anio}
          className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          <h2 className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {anio}° año
          </h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {porAnio.get(anio).map((materia) => {
              const config = configDeEstado(materia.estado)
              const Icon = config.icon
              return (
                <li
                  key={materia.materia_id}
                  data-lista-materia={materia.materia_id}
                  className={`grid grid-cols-1 gap-1 px-4 py-3 sm:items-start sm:gap-4 ${COLUMNAS}`}
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onSeleccionar(materia.materia_id)}
                      className="inline-flex min-h-10 items-center text-left text-sm font-medium text-slate-900 dark:text-slate-100 hover:underline sm:min-h-0"
                    >
                      {materia.nombre}
                    </button>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{materia.codigo}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:block">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}
                    >
                      <Icon size={13} aria-hidden="true" />
                      {config.label}
                    </span>
                    {materia.estado === 'aprobada' && materia.nota != null && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 sm:mt-1">Nota: {materia.nota}</p>
                    )}
                    {enRutaCritica.has(materia.materia_id) && (
                      <p className="flex items-center gap-1 text-xs text-[#ea6c1f] dark:text-[#fb923c] sm:mt-1">
                        <Route size={11} aria-hidden="true" />
                        Ruta crítica
                      </p>
                    )}
                  </div>

                  <div>
                    {materia.estado === 'bloqueada' ? (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        Todavía no cumplís las correlatividades
                      </span>
                    ) : (
                      <AccionesMateria materia={materia} />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default ListaMaterias
