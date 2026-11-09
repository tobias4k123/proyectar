import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Lock, X } from 'lucide-react'
import * as api from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'
import { configDeEstado } from '../../lib/estados'
import { desbloqueaA, requisitosDe } from '../../lib/requisitos'

const MAXIMO_FALTANTES_LISTADOS = 8

const estilosBotonSecundario =
  'rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
const estilosBotonAprobar =
  'rounded-md bg-[#0ca30c] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#0ca30c]/90 disabled:cursor-not-allowed disabled:opacity-60'
const estilosBotonCorregir =
  'rounded-md px-2.5 py-1.5 text-xs font-medium text-[#d03b3b] hover:bg-[#d03b3b]/5 disabled:cursor-not-allowed disabled:opacity-60'

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
function PanelMateria({ indice, materia, onCerrar }) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const [pidiendoNota, setPidiendoNota] = useState(false)
  const [nota, setNota] = useState('')
  const [error, setError] = useState(null)

  const config = configDeEstado(materia.estado)
  const Icon = config.icon
  const requiereTodo = indice.requierenTodo.has(materia.materia_id)
  const paraCursar = requisitosDe(indice, materia.materia_id, 'cursar')
  const paraAprobar = requisitosDe(indice, materia.materia_id, 'final')
  const habilita = desbloqueaA(indice, materia.materia_id)
  const faltanParaCursar = paraCursar.filter((requisito) => !requisito.cumple)

  function alExito() {
    queryClient.invalidateQueries({ queryKey: ['grafo'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['simulacion'] })
    setPidiendoNota(false)
    setNota('')
    setError(null)
  }

  const actualizar = useMutation({
    mutationFn: (cuerpo) => api.actualizarHistorial(token, cuerpo),
    onSuccess: alExito,
    onError: (err) => setError(err.message),
  })

  const eliminar = useMutation({
    mutationFn: (materiaId) => api.eliminarHistorial(token, materiaId),
    onSuccess: alExito,
    onError: (err) => setError(err.message),
  })

  const procesando = actualizar.isPending || eliminar.isPending

  function cambiarEstado(estado) {
    setError(null)
    actualizar.mutate({ materia_id: materia.materia_id, estado })
  }

  function confirmarAprobacion() {
    const valor = Number(nota)
    if (!Number.isInteger(valor) || valor < 1 || valor > 10) {
      setError('La nota tiene que ser un número entero del 1 al 10')
      return
    }
    setError(null)
    actualizar.mutate({ materia_id: materia.materia_id, estado: 'aprobada', nota: valor })
  }

  function corregir() {
    const confirmado = window.confirm(
      `¿Deshacer la carga de "${materia.nombre}"? Vas a tener que volver a cargarla si fue un error.`,
    )
    if (!confirmado) return
    setError(null)
    eliminar.mutate(materia.materia_id)
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 lg:sticky lg:top-6">
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

      <span
        className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon size={13} aria-hidden="true" />
        {config.label}
        {materia.estado === 'aprobada' && materia.nota != null && ` · nota ${materia.nota}`}
      </span>

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

      {error && (
        <p className="mt-3 rounded-md border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-2 text-xs text-[#d03b3b]">
          {error}
        </p>
      )}

      <div
        className={
          materia.estado === 'bloqueada' ? 'hidden' : 'mt-4 border-t border-slate-100 pt-3'
        }
      >
        {pidiendoNota ? (
          <div className="flex items-center gap-2">
            <label htmlFor="nota" className="text-xs font-medium text-slate-700">
              Nota
            </label>
            <input
              id="nota"
              type="number"
              min={1}
              max={10}
              value={nota}
              onChange={(event) => setNota(event.target.value)}
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              disabled={procesando}
              onClick={confirmarAprobacion}
              className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => {
                setPidiendoNota(false)
                setNota('')
                setError(null)
              }}
              className={estilosBotonSecundario}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <Acciones
            materia={materia}
            procesando={procesando}
            onCambiarEstado={cambiarEstado}
            onAprobar={() => {
              setError(null)
              setNota('')
              setPidiendoNota(true)
            }}
            onCorregir={corregir}
          />
        )}
      </div>
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

// Las mismas transiciones que ofrece la pantalla de Historial Académico,
// pero para una sola materia. Quién puede hacer qué lo decide el backend:
// acá solo se muestran los botones que corresponden al estado que informó.
function Acciones({ materia, procesando, onCambiarEstado, onAprobar, onCorregir }) {
  // Para una materia bloqueada no hay nada que hacer todavía, y el motivo
  // ya está explicado más arriba en el panel.
  if (materia.estado === 'bloqueada') return null

  return (
    <div className="flex flex-wrap gap-2">
      {materia.estado === 'disponible' && (
        <button
          type="button"
          disabled={procesando}
          onClick={() => onCambiarEstado('cursando')}
          className={estilosBotonSecundario}
        >
          Empezar a cursar
        </button>
      )}

      {materia.estado === 'cursando' && (
        <>
          <button
            type="button"
            disabled={procesando}
            onClick={() => onCambiarEstado('regular')}
            className={estilosBotonSecundario}
          >
            Marcar regular
          </button>
          {materia.puede_promocionar && (
            <button
              type="button"
              disabled={procesando}
              onClick={onAprobar}
              className={estilosBotonAprobar}
            >
              Aprobar (promoción)
            </button>
          )}
        </>
      )}

      {materia.estado === 'regular' && materia.puede_rendir_final && (
        <button
          type="button"
          disabled={procesando}
          onClick={onAprobar}
          className={estilosBotonAprobar}
        >
          Aprobar (rendí el final)
        </button>
      )}

      {(materia.estado === 'cursando' || materia.estado === 'regular') && (
        <button
          type="button"
          disabled={procesando}
          onClick={() => onCambiarEstado('libre')}
          className={estilosBotonSecundario}
        >
          Marcar libre
        </button>
      )}

      {materia.estado !== 'disponible' && (
        <button
          type="button"
          disabled={procesando}
          onClick={onCorregir}
          className={estilosBotonCorregir}
        >
          Corregir carga
        </button>
      )}
    </div>
  )
}

export default PanelMateria
