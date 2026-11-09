import { useMemo } from 'react'
import { construirMapa, ANCHO_TARJETA } from '../../lib/mapaMaterias'
import TarjetaMateria from './TarjetaMateria'

const COLOR_LINEA = '#cbd5e1'
const COLOR_LINEA_ACTIVA = '#0f172a'
const COLOR_RUTA_CRITICA = '#ea6c1f'

// El mapa completo: las materias ubicadas por año y las líneas de
// correlatividad dibujadas en un <svg> que va por detrás de las tarjetas.
//
// Las líneas que se dibujan son muchas menos que las correlatividades que
// hay: las de las materias que exigen casi todo el plan no se dibujan (se
// explican con un cartel) y las dos correlatividades de un mismo par --
// la de cursada y la del final -- se muestran como una sola línea. Sobre el
// plan real eso lleva el mapa de 45 líneas a 11.
function MapaMaterias({ indice, seleccionId, rutaCriticaIds = [], onSeleccionar }) {
  const mapa = useMemo(() => construirMapa(indice), [indice])

  const enRutaCritica = useMemo(() => new Set(rutaCriticaIds), [rutaCriticaIds])

  // Los tramos de la ruta crítica son los pares consecutivos de la cadena
  // que devuelve el backend. Un tramo que llegue a una materia que exige
  // casi todo el plan no tiene línea dibujada: ahí el resaltado queda en la
  // insignia de la tarjeta.
  const tramosCriticos = useMemo(() => {
    const tramos = new Set()
    for (let i = 0; i < rutaCriticaIds.length - 1; i++) {
      tramos.add(`${rutaCriticaIds[i]}-${rutaCriticaIds[i + 1]}`)
    }
    return tramos
  }, [rutaCriticaIds])

  // Con una materia seleccionada, se resaltan sus líneas y se apaga todo lo
  // que no tenga que ver con ella.
  const relacionadas = useMemo(() => {
    if (!seleccionId) return null
    const ids = new Set([seleccionId])
    for (const conexion of mapa.conexiones) {
      if (conexion.origenId === seleccionId) ids.add(conexion.destinoId)
      if (conexion.destinoId === seleccionId) ids.add(conexion.origenId)
    }
    return ids
  }, [mapa.conexiones, seleccionId])

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
      <div className="relative" style={{ width: mapa.ancho, height: mapa.alto }}>
        <svg
          data-mapa="correlatividades"
          className="pointer-events-none absolute inset-0"
          width={mapa.ancho}
          height={mapa.alto}
          aria-hidden="true"
        >
          <defs>
            {[
              ['punta-linea', COLOR_LINEA],
              ['punta-linea-activa', COLOR_LINEA_ACTIVA],
              ['punta-linea-critica', COLOR_RUTA_CRITICA],
            ].map(([id, color]) => (
              <marker
                key={id}
                id={id}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
              </marker>
            ))}
          </defs>

          {mapa.conexiones.map((conexion) => {
            const activa =
              seleccionId !== null &&
              (conexion.origenId === seleccionId || conexion.destinoId === seleccionId)
            const critica = tramosCriticos.has(conexion.id)
            const apagada = seleccionId !== null && !activa

            let color = COLOR_LINEA
            let marcador = 'punta-linea'
            if (activa) {
              color = COLOR_LINEA_ACTIVA
              marcador = 'punta-linea-activa'
            } else if (critica) {
              color = COLOR_RUTA_CRITICA
              marcador = 'punta-linea-critica'
            }

            return (
              <path
                key={conexion.id}
                d={conexion.d}
                fill="none"
                stroke={color}
                strokeWidth={activa || critica ? 2.5 : 1.5}
                opacity={apagada ? 0.35 : 1}
                markerEnd={`url(#${marcador})`}
              />
            )
          })}
        </svg>

        {mapa.columnas.map((columna) => (
          <p
            key={columna.anio}
            style={{ left: columna.x, width: ANCHO_TARJETA }}
            className="absolute top-0 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            {columna.anio}° año
          </p>
        ))}

        {mapa.materias.map(({ materia, x, y }) => (
          <TarjetaMateria
            key={materia.materia_id}
            materia={materia}
            x={x}
            y={y}
            seleccionada={seleccionId === materia.materia_id}
            atenuada={Boolean(relacionadas) && !relacionadas.has(materia.materia_id)}
            requiereTodo={indice.requierenTodo.has(materia.materia_id)}
            enRutaCritica={enRutaCritica.has(materia.materia_id)}
            onSeleccionar={onSeleccionar}
          />
        ))}
      </div>
    </div>
  )
}

export default MapaMaterias
