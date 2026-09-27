import { Route, FlaskConical } from 'lucide-react'
import { ESTADO_CONFIG } from '../../lib/estados'

// `mostrarRutaCritica` agrega las referencias de ruta crítica / modo
// simulación -- solo tienen sentido en la pantalla de Ruta Crítica, así
// que Plan de Estudios sigue mostrando la leyenda simple de siempre.
function EstadoLegend({ mostrarRutaCritica = false }) {
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
      {mostrarRutaCritica && (
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2">
          <span className="flex items-center gap-1.5 text-[#ea6c1f]">
            <Route size={14} aria-hidden="true" />
            En la ruta crítica
          </span>
          <span className="flex items-center gap-1.5 text-[#7c5fe0]">
            <FlaskConical size={14} aria-hidden="true" />
            Simulado (no se guarda)
          </span>
        </div>
      )}
    </div>
  )
}

export default EstadoLegend
