import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../lib/apiClient'
import { useAuthStore } from '../store/useAuthStore'
import { configDeEstado } from '../lib/estados'

const estilosBotonSecundario =
  'rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
const estilosBotonAprobar =
  'rounded-md bg-[#0ca30c] px-2 py-1 text-xs font-medium text-white hover:bg-[#0ca30c]/90 disabled:cursor-not-allowed disabled:opacity-60'
const estilosBotonCorregir =
  'rounded-md px-2 py-1 text-xs font-medium text-[#d03b3b] hover:bg-[#d03b3b]/5 disabled:cursor-not-allowed disabled:opacity-60'

function Historial() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  // materia_id de la fila que está pidiendo la nota para aprobar (null =
  // ninguna). Solo puede haber una abierta a la vez.
  const [aprobando, setAprobando] = useState(null)
  const [nota, setNota] = useState('')
  const [error, setError] = useState(null)

  const { data, isLoading, isError, error: errorCarga } = useQuery({
    queryKey: ['grafo'],
    queryFn: () => api.obtenerGrafo(token),
    enabled: Boolean(token),
  })

  function alExito() {
    // Mismo queryKey que usa PlanDeEstudios: un cambio acá se refleja
    // también en el gráfico sin recargar la página.
    queryClient.invalidateQueries({ queryKey: ['grafo'] })
    setAprobando(null)
    setNota('')
    setError(null)
  }

  function alError(err) {
    setError(err.message)
  }

  const actualizar = useMutation({
    mutationFn: (body) => api.actualizarHistorial(token, body),
    onSuccess: alExito,
    onError: alError,
  })

  const eliminar = useMutation({
    mutationFn: (materiaId) => api.eliminarHistorial(token, materiaId),
    onSuccess: alExito,
    onError: alError,
  })

  const procesando = actualizar.isPending || eliminar.isPending

  function cambiarEstado(materiaId, estado) {
    actualizar.mutate({ materia_id: materiaId, estado })
  }

  function abrirAprobacion(materiaId) {
    setError(null)
    setNota('')
    setAprobando(materiaId)
  }

  function cancelarAprobacion() {
    setAprobando(null)
    setNota('')
    setError(null)
  }

  function confirmarAprobacion(materiaId) {
    const valor = Number(nota)
    if (!Number.isInteger(valor) || valor < 1 || valor > 10) {
      setError('La nota tiene que ser un número entero del 1 al 10')
      return
    }
    actualizar.mutate({ materia_id: materiaId, estado: 'aprobada', nota: valor })
  }

  function corregir(materiaId, nombre) {
    const confirmado = window.confirm(
      `¿Deshacer la carga de "${nombre}"? Vas a tener que volver a cargarla si fue un error.`,
    )
    if (!confirmado) return
    setError(null)
    eliminar.mutate(materiaId)
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Historial Académico</h1>
        <p className="text-slate-600">
          Cargá el estado real de cada materia. Los cambios se reflejan al instante en el
          plan de estudios.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-3 text-sm text-[#d03b3b]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
          Cargando historial…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-4 text-sm text-[#d03b3b]">
          No se pudo cargar tu historial: {errorCarga.message}
        </div>
      )}

      {data && (
        <TablaHistorial
          nodos={data.nodos}
          aprobando={aprobando}
          nota={nota}
          setNota={setNota}
          procesando={procesando}
          onCambiarEstado={cambiarEstado}
          onAbrirAprobacion={abrirAprobacion}
          onCancelarAprobacion={cancelarAprobacion}
          onConfirmarAprobacion={confirmarAprobacion}
          onCorregir={corregir}
        />
      )}
    </section>
  )
}

function TablaHistorial({
  nodos,
  aprobando,
  nota,
  setNota,
  procesando,
  onCambiarEstado,
  onAbrirAprobacion,
  onCancelarAprobacion,
  onConfirmarAprobacion,
  onCorregir,
}) {
  const porAnio = {}
  for (const materia of nodos) {
    if (!porAnio[materia.anio_carrera]) porAnio[materia.anio_carrera] = []
    porAnio[materia.anio_carrera].push(materia)
  }
  const anios = Object.keys(porAnio)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      {anios.map((anio) => (
        <div key={anio} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            {anio}° año
          </h2>
          <table className="w-full text-left text-sm">
            <tbody>
              {porAnio[anio].map((materia) => (
                <FilaMateria
                  key={materia.materia_id}
                  materia={materia}
                  estaAprobando={aprobando === materia.materia_id}
                  nota={nota}
                  setNota={setNota}
                  procesando={procesando}
                  onCambiarEstado={onCambiarEstado}
                  onAbrirAprobacion={onAbrirAprobacion}
                  onCancelarAprobacion={onCancelarAprobacion}
                  onConfirmarAprobacion={onConfirmarAprobacion}
                  onCorregir={onCorregir}
                />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function FilaMateria({
  materia,
  estaAprobando,
  nota,
  setNota,
  procesando,
  onCambiarEstado,
  onAbrirAprobacion,
  onCancelarAprobacion,
  onConfirmarAprobacion,
  onCorregir,
}) {
  const config = configDeEstado(materia.estado)
  const Icon = config.icon

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 align-top">
        <p className="font-medium text-slate-900">{materia.nombre}</p>
        <p className="text-xs text-slate-400">{materia.codigo}</p>
      </td>

      <td className="px-4 py-3 align-top">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}
        >
          <Icon size={13} aria-hidden="true" />
          {config.label}
        </span>
        {materia.estado === 'aprobada' && materia.nota != null && (
          <p className="mt-1 text-xs text-slate-500">Nota: {materia.nota}</p>
        )}
      </td>

      <td className="px-4 py-3 align-top">
        {estaAprobando ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={10}
              value={nota}
              onChange={(event) => setNota(event.target.value)}
              placeholder="Nota"
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              disabled={procesando}
              onClick={() => onConfirmarAprobacion(materia.materia_id)}
              className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirmar
            </button>
            <button type="button" onClick={onCancelarAprobacion} className={estilosBotonSecundario}>
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {materia.estado === 'disponible' && (
              <button
                type="button"
                disabled={procesando}
                onClick={() => onCambiarEstado(materia.materia_id, 'cursando')}
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
                  onClick={() => onCambiarEstado(materia.materia_id, 'regular')}
                  className={estilosBotonSecundario}
                >
                  Marcar regular
                </button>
                {materia.puede_promocionar && (
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => onAbrirAprobacion(materia.materia_id)}
                    className={estilosBotonAprobar}
                  >
                    Aprobar (promoción)
                  </button>
                )}
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => onCambiarEstado(materia.materia_id, 'libre')}
                  className={estilosBotonSecundario}
                >
                  Marcar libre
                </button>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => onCorregir(materia.materia_id, materia.nombre)}
                  className={estilosBotonCorregir}
                >
                  Corregir carga
                </button>
              </>
            )}

            {materia.estado === 'regular' && (
              <>
                {materia.puede_rendir_final && (
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => onAbrirAprobacion(materia.materia_id)}
                    className={estilosBotonAprobar}
                  >
                    Aprobar (rendí el final)
                  </button>
                )}
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => onCambiarEstado(materia.materia_id, 'libre')}
                  className={estilosBotonSecundario}
                >
                  Marcar libre
                </button>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => onCorregir(materia.materia_id, materia.nombre)}
                  className={estilosBotonCorregir}
                >
                  Corregir carga
                </button>
              </>
            )}

            {materia.estado === 'aprobada' && (
              <button
                type="button"
                disabled={procesando}
                onClick={() => onCorregir(materia.materia_id, materia.nombre)}
                className={estilosBotonCorregir}
              >
                Corregir carga
              </button>
            )}

            {materia.estado === 'bloqueada' && (
              <span className="text-xs text-slate-400">
                Todavía no cumplís las correlatividades
              </span>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

export default Historial
