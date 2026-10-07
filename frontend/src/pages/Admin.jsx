import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as api from '../lib/apiClient'
import { useAuthStore } from '../store/useAuthStore'
import TabMaterias from '../components/admin/TabMaterias'
import TabCorrelatividades from '../components/admin/TabCorrelatividades'

const TABS = [
  { id: 'materias', label: 'Materias' },
  { id: 'correlatividades', label: 'Correlatividades' },
]

function Admin() {
  const token = useAuthStore((state) => state.token)
  const [tab, setTab] = useState('materias')

  // Las dos pestañas necesitan la lista de materias (la de
  // correlatividades para los selects de materia/correlativa) -- se pide
  // una sola vez acá y se comparte, en vez de duplicar el fetch.
  const materiasQuery = useQuery({
    queryKey: ['admin', 'materias'],
    queryFn: () => api.listarMateriasAdmin(token),
    enabled: Boolean(token),
  })

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Administración</h1>
        <p className="text-slate-600">
          Gestioná las materias y correlatividades del plan de estudios.
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'materias' ? (
        <TabMaterias materiasQuery={materiasQuery} />
      ) : (
        <TabCorrelatividades materiasQuery={materiasQuery} />
      )}
    </section>
  )
}

export default Admin
