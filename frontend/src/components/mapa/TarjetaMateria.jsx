import { Lock, Sparkles } from 'lucide-react'
import { configDeEstado } from '../../lib/estados'
import { ALTO_TARJETA, ANCHO_TARJETA } from '../../lib/mapaMaterias'

// Una materia del mapa. Es un <button> y no un <div> a propósito: así se
// puede recorrer el mapa con el teclado y cada materia se anuncia como lo
// que es, algo en lo que se puede entrar.
function TarjetaMateria({ materia, x, y, seleccionada, atenuada, requiereTodo, onSeleccionar }) {
  const config = configDeEstado(materia.estado)
  const Icon = config.icon
  const puedeAvanzar =
    (materia.estado === 'regular' && materia.puede_rendir_final) ||
    (materia.estado === 'cursando' && materia.puede_promocionar)

  return (
    <button
      type="button"
      onClick={() => onSeleccionar(materia.materia_id)}
      style={{ left: x, top: y, width: ANCHO_TARJETA, height: ALTO_TARJETA }}
      className={`absolute flex flex-col justify-center rounded-lg border-2 px-2.5 text-left shadow-sm transition-all ${
        config.border
      } ${config.bg} ${
        seleccionada ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:shadow-md'
      } ${atenuada ? 'opacity-30' : ''} ${
        materia.simulado ? 'outline outline-2 outline-dashed outline-[#7c5fe0] outline-offset-2' : ''
      }`}
      aria-pressed={seleccionada}
    >
      {puedeAvanzar && (
        <span
          title={materia.estado === 'regular' ? 'Podés rendir el final' : 'Podés promocionarla'}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white shadow"
        >
          <Sparkles size={11} aria-hidden="true" />
        </span>
      )}

      <div className="flex items-center gap-1">
        <span className={`flex items-center gap-1 text-[11px] font-medium ${config.text}`}>
          <Icon size={12} aria-hidden="true" />
          {config.label}
          {materia.estado === 'aprobada' && materia.nota != null && ` · ${materia.nota}`}
        </span>
        <span className="ml-auto shrink-0 text-[9px] text-slate-400">{materia.codigo}</span>
      </div>

      <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-tight text-slate-900">
        {materia.nombre}
      </p>

      {requiereTodo && (
        <span className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-slate-500">
          <Lock size={9} aria-hidden="true" />
          Requiere todo el plan aprobado
        </span>
      )}
    </button>
  )
}

export default TarjetaMateria
