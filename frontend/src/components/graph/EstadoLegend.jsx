import { CheckCircle2, BadgeCheck, Clock, Circle, Lock } from 'lucide-react'

const ESTADOS = [
  { label: 'Aprobada', icon: CheckCircle2, className: 'text-[#0ca30c]' },
  { label: 'Regular', icon: BadgeCheck, className: 'text-[#2a78d6]' },
  { label: 'Cursando', icon: Clock, className: 'text-[#946200]' },
  { label: 'Disponible', icon: Circle, className: 'text-slate-600' },
  { label: 'Bloqueada', icon: Lock, className: 'text-slate-400' },
]

function EstadoLegend() {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
      <div className="flex flex-wrap items-center gap-4">
        {ESTADOS.map(({ label, icon: Icon, className }) => (
          <span key={label} className="flex items-center gap-1.5">
            <Icon size={14} className={className} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2">
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#898781" strokeWidth="2" />
          </svg>
          Correlativa para cursar
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#898781" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          Correlativa para rendir el final
        </span>
      </div>
    </div>
  )
}

export default EstadoLegend
