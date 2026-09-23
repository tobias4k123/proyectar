import { Handle, Position } from '@xyflow/react'
import { CheckCircle2, BadgeCheck, Clock, Circle, Lock } from 'lucide-react'

// Los 5 estados reales que calcula el backend (backend/app/grafo.py).
// Colores tomados de la paleta fija de estado + un neutro para
// disponible/bloqueada. Nunca se usa el color solo: siempre va con
// ícono y texto.
const ESTADO_CONFIG = {
  aprobada: {
    label: 'Aprobada',
    icon: CheckCircle2,
    border: 'border-[#0ca30c]',
    bg: 'bg-[#0ca30c]/10',
    text: 'text-[#0ca30c]',
  },
  regular: {
    label: 'Regular',
    icon: BadgeCheck,
    border: 'border-[#2a78d6]',
    bg: 'bg-[#2a78d6]/10',
    text: 'text-[#2a78d6]',
  },
  cursando: {
    label: 'Cursando',
    icon: Clock,
    border: 'border-[#c98500]',
    bg: 'bg-[#fab219]/15',
    text: 'text-[#946200]',
  },
  disponible: {
    label: 'Disponible',
    icon: Circle,
    border: 'border-slate-400',
    bg: 'bg-white',
    text: 'text-slate-600',
  },
  bloqueada: {
    label: 'Bloqueada',
    icon: Lock,
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    text: 'text-slate-400',
  },
}

function MateriaNode({ data }) {
  const config = ESTADO_CONFIG[data.estado] ?? ESTADO_CONFIG.bloqueada
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
