import { Handle, Position } from '@xyflow/react'
import { configDeEstado } from '../../lib/estados'

function MateriaNode({ data }) {
  const config = configDeEstado(data.estado)
  const Icon = config.icon
  const bloqueada = data.estado === 'bloqueada'

  return (
    <div
      className={`w-48 rounded-lg border-2 px-3 py-2 shadow-sm ${config.border} ${config.bg} ${
        bloqueada ? 'opacity-70' : 'opacity-100'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />

      <div className={`flex items-center gap-1.5 text-xs font-medium ${config.text}`}>
        <Icon size={14} aria-hidden="true" />
        <span>{config.label}</span>
        {data.estado === 'regular' && data.puedeRendirFinal && (
          <span className="ml-auto rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Final disponible
          </span>
        )}
      </div>

      <p className="mt-1 text-sm font-semibold leading-tight text-slate-900">
        {data.nombre}
      </p>
      <p className="text-[10px] text-slate-400">{data.codigo}</p>

      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
    </div>
  )
}

export default MateriaNode
