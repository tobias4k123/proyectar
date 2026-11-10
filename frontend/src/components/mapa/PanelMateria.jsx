import { ArrowRight, Check, Lock, Route, X } from 'lucide-react'
import { configDeEstado } from '../../lib/estados'
import { desbloqueaA, requisitosDe } from '../../lib/requisitos'
import AccionesMateria from './AccionesMateria'

const MAXIMO_FALTANTES_LISTADOS = 8

function textoRequisito(requiere) {
  return requiere === 'aprobada' ? 'aprobada' : 'cursada'
}

function textoFaltante(requisito) {
  return requisito.requiere === 'aprobada'
    ? `aprobar ${requisito.materia.nombre}`
    : `tener cursada ${requisito.materia.nombre}`
}

// El panel de una materia: qué es, en qué estado está, qué le falta, qué
// habilita, y las acciones para cargar o corregir su estado.
//
// Es el lugar donde las correlatividades se explican con palabras. El mapa
// muestra que hay una dependencia; acá se dice cuál es y si está cumplida,
// que es lo que realmente necesita saber el alumno. Y es también donde se
// carga el historial, para no tener que irse a otra pantalla.
function PanelMateria({ indice, materia, enRutaCritica, onCerrar }) {
  const config = configDeEstado(materia.estado)
  const Icon = config.icon
  const requiereTodo = indice.requierenTodo.has(materia.materia_id)
  const paraCursar = requisitosDe(indice, materia.materia_id, 'cursar')
  const paraAprobar = requisitosDe(indice, materia.materia_id, 'final')
  const habilita = desbloqueaA(indice, materia.materia_id)
  const faltanParaCursar = paraCursar.filter((requisito) => !requisito.cumple)

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold leading-tight text-slate-900">{materia.nombre}</h2>
          <p className="text-xs text-slate-400">
            {materia.codigo} · {materia.anio_carrera}° año
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}
        >
          <Icon size={13} aria-hidden="true" />
          {config.label}
          {materia.estado === 'aprobada' && materia.nota != null && ` · nota ${materia.nota}`}
        </span>
        {enRutaCritica && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ea6c1f]/10 px-2 py-1 text-xs font-medium text-[#ea6c1f]">
            <Route size={13} aria-hidden="true" />
            En la ruta crítica
          </span>
        )}
        {materia.simulado && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7c5fe0]/10 px-2 py-1 text-xs font-medium text-[#7c5fe0]">
            Simulada
          </span>
        )}
      </div>

      {materia.estado === 'bloqueada' && faltanParaCursar.length > 0 && (
        <p className="mt-3 rounded-md bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600">
          Todavía no la podés cursar. Te falta {faltanParaCursar.map(textoFaltante).join(', y ')}.
        </p>
      )}

      {requiereTodo ? (
        <RequisitoTodoElPlan requisitos={paraAprobar} />
      ) : (
        <>
          <ListaRequisitos titulo="Para cursarla necesitás" requisitos={paraCursar} />
          <ListaRequisitos titulo="Para aprobarla necesitás" requisitos={paraAprobar} />
        </>
      )}

      {habilita.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Al aprobarla habilitás
          </h3>
          <ul className="mt-1.5 space-y-1">
            {habilita.map((destino) => (
              <li
                key={destino.materia_id}
                className="flex items-center gap-1.5 text-xs text-slate-600"
              >
                <ArrowRight size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
                {destino.nombre}
              </li>
            ))}
          </ul>
        </div>
      )}

      {materia.estado !== 'bloqueada' && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <AccionesMateria materia={materia} />
        </div>
      )}
    </aside>
  )
}

function ListaRequisitos({ titulo, requisitos }) {
  if (requisitos.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</h3>
      <ul className="mt-1.5 space-y-1">
        {requisitos.map((requisito) => (
          <li
            key={`${requisito.materia.materia_id}-${requisito.requiere}`}
            className="flex items-start gap-1.5 text-xs"
          >
            {requisito.cumple ? (
              <Check size={13} className="mt-0.5 shrink-0 text-[#0ca30c]" aria-hidden="true" />
            ) : (
              <Lock size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
            )}
            <span className={requisito.cumple ? 'text-slate-500' : 'text-slate-700'}>
              {requisito.materia.nombre}{' '}
              <span className="text-slate-400">({textoRequisito(requisito.requiere)})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Para una materia que exige casi todas las demás (en el plan real,
// Práctica Profesionalizante II pide las 22 restantes aprobadas) no tiene
// sentido listar los 22 requisitos ni dibujar 22 líneas: lo útil es el
// número que falta y cuáles son.
function RequisitoTodoElPlan({ requisitos }) {
  const faltantes = requisitos.filter((requisito) => !requisito.cumple)
  const listadas = faltantes.slice(0, MAXIMO_FALTANTES_LISTADOS)
  const restantes = faltantes.length - listadas.length

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Para aprobarla necesitás
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
        Las {requisitos.length} materias del plan aprobadas.{' '}
        {faltantes.length === 0 ? (
          <span className="font-medium text-[#0ca30c]">Ya las tenés todas.</span>
        ) : (
          <span className="font-medium text-slate-900">Te faltan {faltantes.length}.</span>
        )}
      </p>
      {faltantes.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {listadas.map((requisito) => (
            <li
              key={requisito.materia.materia_id}
              className="flex items-start gap-1.5 text-xs text-slate-700"
            >
              <Lock size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              {requisito.materia.nombre}
            </li>
          ))}
          {restantes > 0 && (
            <li className="pl-[18px] text-xs text-slate-400">y {restantes} más</li>
          )}
        </ul>
      )}
    </div>
  )
}

export default PanelMateria
