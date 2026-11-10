import { Lock, Route, Sparkles } from 'lucide-react'
import { configDeEstado } from '../../lib/estados'
import { ALTO_TARJETA_REM, ANCHO_TARJETA_REM } from '../../lib/mapaMaterias'

// Una materia del mapa. Es un <button> y no un <div> a propósito: así se
// puede recorrer el mapa con el teclado y cada materia se anuncia como lo
// que es, algo en lo que se puede entrar.
function TarjetaMateria({
  materia,
  x,
  y,
  seleccionada,
  atenuada,
  requiereTodo,
  enRutaCritica,
  deshabilitada,
  onSeleccionar,
}) {
  const config = configDeEstado(materia.estado)
  const Icon = config.icon
  const puedeAvanzar =
    (materia.estado === 'regular' && materia.puede_rendir_final) ||
    (materia.estado === 'cursando' && materia.puede_promocionar)

  return (
    <button
      type="button"
      data-materia={materia.materia_id}
      disabled={deshabilitada}
      onClick={() => onSeleccionar(materia.materia_id)}
      // El alto y el ancho van en rem y las posiciones en píxeles ya
      // convertidos: así la tarjeta crece con el resto de la interfaz y
      // sigue coincidiendo con las líneas del <svg>.
      style={{ left: x, top: y, width: `${ANCHO_TARJETA_REM}rem`, height: `${ALTO_TARJETA_REM}rem` }}
      className={`absolute flex flex-col justify-center rounded-lg border-2 px-3 text-left shadow-sm transition-all ${
        config.border
      } ${config.bg} ${
        // El anillo de selección gana sobre el de ruta crítica: el foco es
        // lo último que hizo el alumno, y la ruta crítica igual se sigue
        // reconociendo por la insignia de la esquina.
        seleccionada
          ? 'ring-2 ring-slate-900 ring-offset-2'
          : enRutaCritica
            ? 'ring-2 ring-[#ea6c1f] ring-offset-1'
            : 'hover:shadow-md'
      } ${atenuada ? 'opacity-30' : ''} ${
        deshabilitada ? 'cursor-not-allowed opacity-40' : ''
      } ${
        materia.simulado ? 'outline outline-2 outline-dashed outline-[#7c5fe0] outline-offset-2' : ''
      }`}
      aria-pressed={seleccionada}
    >
      {enRutaCritica && (
        <span
          title="En la ruta crítica"
          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ea6c1f] text-white shadow"
        >
          <Route size={11} aria-hidden="true" />
        </span>
      )}

      {puedeAvanzar && (
        <span
          title={materia.estado === 'regular' ? 'Podés rendir el final' : 'Podés promocionarla'}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow"
        >
          <Sparkles size={11} aria-hidden="true" />
        </span>
      )}

      <div className="flex items-center gap-1.5">
        <span className={`flex items-center gap-1 text-xs font-medium ${config.text}`}>
          <Icon size={13} aria-hidden="true" />
          {config.label}
          {materia.estado === 'aprobada' && materia.nota != null && ` · ${materia.nota}`}
        </span>
        <span className="ml-auto shrink-0 text-[10px] text-slate-400 dark:text-slate-500">{materia.codigo}</span>
      </div>

      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
        {materia.nombre}
      </p>

      {requiereTodo && (
        <span className="mt-1 flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
          <Lock size={10} aria-hidden="true" />
          Requiere todo el plan aprobado
        </span>
      )}
    </button>
  )
}

export default TarjetaMateria
