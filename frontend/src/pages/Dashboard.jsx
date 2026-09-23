import { useQuery } from '@tanstack/react-query'
import { Award, ListChecks } from 'lucide-react'
import * as api from '../lib/apiClient'
import { useAuthStore } from '../store/useAuthStore'
import { ESTADO_CONFIG } from '../lib/estados'

function Dashboard() {
  const token = useAuthStore((state) => state.token)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.obtenerDashboard(token),
    enabled: Boolean(token),
  })

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Estado académico</h1>
        <p className="text-slate-600">
          Resumen de tu avance en la carrera, calculado por el backend a partir
          de tu historial académico.
        </p>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
          Cargando resumen…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-4 text-sm text-[#d03b3b]">
          No se pudo cargar tu resumen académico: {error.message}
        </div>
      )}

      {data && <ResumenAcademico data={data} />}
    </section>
  )
}

function ResumenAcademico({ data }) {
  const { total_materias, aprobadas, cursando, regulares, porcentaje_avance, promedio } = data
  // No es un dato que devuelva el backend: se deriva acá para no dejarle al
  // alumno la cuenta de "el resto" (materias disponibles + bloqueadas).
  const pendientes = Math.max(total_materias - aprobadas - cursando - regulares, 0)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Avance de la carrera</p>
            <p className="text-5xl font-semibold text-slate-900">
              {porcentaje_avance}
              <span className="text-2xl text-slate-400">%</span>
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {aprobadas} de {total_materias} materias aprobadas
          </p>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#0ca30c]/10">
          <div
            className="h-full rounded-full bg-[#0ca30c] transition-all duration-300"
            style={{ width: `${Math.min(porcentaje_avance, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <TarjetaEstadistica
          label="Aprobadas"
          valor={aprobadas}
          Icon={ESTADO_CONFIG.aprobada.icon}
          colorTexto={ESTADO_CONFIG.aprobada.text}
          colorFondo={ESTADO_CONFIG.aprobada.bg}
        />
        <TarjetaEstadistica
          label="Regulares"
          valor={regulares}
          Icon={ESTADO_CONFIG.regular.icon}
          colorTexto={ESTADO_CONFIG.regular.text}
          colorFondo={ESTADO_CONFIG.regular.bg}
        />
        <TarjetaEstadistica
          label="Cursando"
          valor={cursando}
          Icon={ESTADO_CONFIG.cursando.icon}
          colorTexto={ESTADO_CONFIG.cursando.text}
          colorFondo={ESTADO_CONFIG.cursando.bg}
        />
        <TarjetaEstadistica
          label="Pendientes"
          valor={pendientes}
          Icon={ListChecks}
          colorTexto="text-slate-500"
          colorFondo="bg-slate-100"
        />
        <TarjetaEstadistica
          label="Promedio"
          valor={promedio != null ? promedio : '—'}
          sufijo={promedio != null ? '/10' : undefined}
          Icon={Award}
          colorTexto="text-slate-500"
          colorFondo="bg-slate-100"
        />
      </div>
    </div>
  )
}

function TarjetaEstadistica({ label, valor, sufijo, Icon, colorTexto, colorFondo }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colorFondo}`}>
        <Icon size={16} className={colorTexto} aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">
        {valor}
        {sufijo && <span className="ml-0.5 text-sm font-normal text-slate-400">{sufijo}</span>}
      </p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

export default Dashboard
