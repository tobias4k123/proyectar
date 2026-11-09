import { useEffect, useMemo, useRef, useState } from 'react'
import { construirMapa, ANCHO_TARJETA } from '../../lib/mapaMaterias'
import TarjetaMateria from './TarjetaMateria'

const COLOR_LINEA = '#cbd5e1'
const COLOR_LINEA_ACTIVA = '#0f172a'
const COLOR_RUTA_CRITICA = '#ea6c1f'
const COLOR_SIMULADO = '#7c5fe0'

// Hasta cuánto se agranda el mapa para aprovechar el ancho disponible. No
// se achica nunca por debajo de 1: en una pantalla angosta es preferible
// desplazar el mapa a la izquierda y la derecha que dejar las materias
// ilegibles.
const ESCALA_MAXIMA = 1.45

// El mapa completo: las materias ubicadas por año y las líneas de
// correlatividad dibujadas en un <svg> que va por detrás de las tarjetas.
//
// Las líneas que se dibujan son muchas menos que las correlatividades que
// hay: las de las materias que exigen casi todo el plan no se dibujan (se
// explican con un cartel) y las dos correlatividades de un mismo par --
// la de cursada y la del final -- se muestran como una sola línea. Sobre el
// plan real eso lleva el mapa de 45 líneas a 11.
function MapaMaterias({
  indice,
  seleccionId,
  rutaCriticaIds = [],
  simuladasIds = [],
  modoSimulacion = false,
  onSeleccionar,
}) {
  const mapa = useMemo(() => construirMapa(indice), [indice])
  const contenedorRef = useRef(null)
  const [escala, setEscala] = useState(1)

  // El mapa se dibuja con medidas fijas y después se escala a lo que haya
  // de ancho, así aprovecha la pantalla sin que haya que rehacer el cálculo
  // de posiciones ni el de las líneas.
  useEffect(() => {
    const nodo = contenedorRef.current
    if (!nodo) return undefined
    const observador = new ResizeObserver(([entrada]) => {
      const disponible = entrada.contentRect.width
      setEscala(Math.min(Math.max(disponible / mapa.ancho, 1), ESCALA_MAXIMA))
    })
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [mapa.ancho])

  const enRutaCritica = useMemo(() => new Set(rutaCriticaIds), [rutaCriticaIds])
  const simuladas = useMemo(() => new Set(simuladasIds), [simuladasIds])

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
    <div ref={contenedorRef} className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
      <div style={{ width: mapa.ancho * escala, height: mapa.alto * escala }}>
        <div
          className="relative"
          style={{
            width: mapa.ancho,
            height: mapa.alto,
            transform: `scale(${escala})`,
            transformOrigin: 'top left',
          }}
        >
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
                ['punta-linea-simulada', COLOR_SIMULADO],
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
              // En el simulador se resalta lo que sale de cada materia dada
              // por aprobada: así se ve de dónde viene cada materia que se
              // acaba de habilitar, en vez de que aparezca sin explicación.
              const desdeSimulada = simuladas.has(conexion.origenId)
              const critica = tramosCriticos.has(conexion.id)
              const apagada = seleccionId !== null && !activa

              let color = COLOR_LINEA
              let marcador = 'punta-linea'
              if (activa) {
                color = COLOR_LINEA_ACTIVA
                marcador = 'punta-linea-activa'
              } else if (desdeSimulada) {
                color = COLOR_SIMULADO
                marcador = 'punta-linea-simulada'
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
                  strokeWidth={activa || critica || desdeSimulada ? 2.5 : 1.5}
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
              className="absolute top-0 text-center text-sm font-semibold uppercase tracking-wide text-slate-400"
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
              // En el simulador solo tiene sentido tocar lo que hoy se
              // podría cursar: dar por aprobada una materia bloqueada sería
              // simular algo que no puede pasar.
              deshabilitada={
                modoSimulacion &&
                (materia.estado === 'bloqueada' ||
                  (materia.estado === 'aprobada' && !materia.simulado))
              }
              onSeleccionar={onSeleccionar}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MapaMaterias
