import { Route } from 'lucide-react'
import { configDeEstado } from '../../lib/estados'
import AccionesMateria from './AccionesMateria'

// La misma información del mapa, en forma de tabla por año. Sirve para dos
// cosas: cargar varias materias seguidas sin ir y volver del mapa al panel,
// y ser la alternativa legible para quien no saque nada de un diagrama.
//
// Las acciones son las mismas de `AccionesMateria`, el componente que usa
// también el panel: la máquina de estados vive en un solo lugar.
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
        <div key={anio} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h2 className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {anio}° año
          </h2>
          <table className="w-full text-left text-sm">
            <tbody>
              {porAnio.get(anio).map((materia) => {
                const config = configDeEstado(materia.estado)
                const Icon = config.icon
                return (
                  <tr key={materia.materia_id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => onSeleccionar(materia.materia_id)}
                        className="text-left font-medium text-slate-900 dark:text-slate-100 hover:underline"
                      >
                        {materia.nombre}
                      </button>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{materia.codigo}</p>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}
                      >
                        <Icon size={13} aria-hidden="true" />
                        {config.label}
                      </span>
                      {materia.estado === 'aprobada' && materia.nota != null && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nota: {materia.nota}</p>
                      )}
                      {enRutaCritica.has(materia.materia_id) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#ea6c1f] dark:text-[#fb923c]">
                          <Route size={11} aria-hidden="true" />
                          Ruta crítica
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {materia.estado === 'bloqueada' ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Todavía no cumplís las correlatividades
                        </span>
                      ) : (
                        <AccionesMateria materia={materia} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default ListaMaterias
