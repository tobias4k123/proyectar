import { ESTADO_CONFIG } from '../../lib/estados'

function EstadoLegend() {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
      <div className="flex flex-wrap items-center gap-4">
        {Object.values(ESTADO_CONFIG).map(({ label, icon: Icon, text }) => (
          <span key={label} className="flex items-center gap-1.5">
            <Icon size={14} className={text} aria-hidden="true" />
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
