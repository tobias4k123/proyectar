import { Handle, Position } from '@xyflow/react'
import { Route, FlaskConical } from 'lucide-react'
import { configDeEstado } from '../../lib/estados'

function MateriaNode({ data }) {
  const config = configDeEstado(data.estado)
  const Icon = config.icon
  const bloqueada = data.estado === 'bloqueada'
  const puedeAvanzar =
    (data.estado === 'regular' && data.puedeRendirFinal) ||
    (data.estado === 'cursando' && data.puedePromocionar)

  return (
    <div className="relative">
      {data.enRutaCritica && (
        <span
          title="En la ruta crítica"
          className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#ea6c1f] text-white shadow"
        >
          <Route size={12} aria-hidden="true" />
        </span>
      )}

      <div
        className={`w-48 rounded-lg border-2 px-3 py-2 shadow-sm ${config.border} ${config.bg} ${
          bloqueada ? 'opacity-70' : 'opacity-100'
        } ${data.enRutaCritica ? 'ring-2 ring-[#ea6c1f] ring-offset-1' : ''} ${
          data.simulado ? 'outline outline-2 outline-dashed outline-[#7c5fe0] outline-offset-2' : ''
        }`}
      >
        <Handle type="target" position={Position.Left} className="!bg-slate-400" />

        <div className={`flex items-center gap-1.5 text-xs font-medium ${config.text}`}>
          <Icon size={14} aria-hidden="true" />
          <span>{config.label}</span>
          {puedeAvanzar && (
            <span className="ml-auto rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {data.estado === 'regular' ? 'Final disponible' : 'Promoción disponible'}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm font-semibold leading-tight text-slate-900">
          {data.nombre}
        </p>
        <p className="text-[10px] text-slate-400">{data.codigo}</p>

        {data.simulado && (
          <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[#7c5fe0]">
            <FlaskConical size={10} aria-hidden="true" />
            Simulado
          </p>
        )}

        <Handle type="source" position={Position.Right} className="!bg-slate-400" />
      </div>
    </div>
  )
}

export default MateriaNode
