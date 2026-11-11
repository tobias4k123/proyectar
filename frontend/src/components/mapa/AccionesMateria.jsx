import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'

// En celular se toca con el dedo, así que ningún botón baja de 40px de
// alto; en pantallas con mouse vuelven a ser compactos (`sm:min-h-0`), que
// es como ya estaban.
const TACTIL = 'inline-flex items-center justify-center min-h-10 sm:min-h-0'

const estilosBotonSecundario =
  `${TACTIL} rounded-md border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60`
const estilosBotonAprobar =
  `${TACTIL} rounded-md bg-[#0ca30c] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#0ca30c]/90 disabled:cursor-not-allowed disabled:opacity-60`
const estilosBotonCorregir =
  `${TACTIL} rounded-md px-2.5 py-1.5 text-xs font-medium text-[#d03b3b] dark:text-[#f87171] hover:bg-[#d03b3b]/5 disabled:cursor-not-allowed disabled:opacity-60`

// Notas mínimas del régimen de IFES, las mismas que valida el backend en
// `routers/alumnos.py`: rindiendo el final se aprueba con 4, y promocionar
// sin rendirlo exige 8. Acá se repiten para avisar antes de mandar el
// pedido, pero la regla que vale es la del backend.
const NOTA_MINIMA_FINAL = 4
const NOTA_MINIMA_PROMOCION = 8

// Las transiciones de estado de una materia, con su pedido de nota y sus
// errores. Vive en su propio componente porque lo usan dos lugares: el
// panel de detalle del mapa y cada fila de la vista de lista. Duplicar la
// máquina de estados en los dos sería la forma más fácil de que se
// desincronicen.
//
// Qué transiciones existen lo decide el backend: acá solo se muestran los
// botones que corresponden al estado que informó para esta materia.
function AccionesMateria({ materia }) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const [pidiendoNota, setPidiendoNota] = useState(false)
  const [nota, setNota] = useState('')
  const [error, setError] = useState(null)

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

  // Desde "cursando" la aprobación es una promoción; desde "regular" es
  // haber rendido el final. El mínimo cambia según el caso.
  const promociona = materia.estado === 'cursando'
  const notaMinima = promociona ? NOTA_MINIMA_PROMOCION : NOTA_MINIMA_FINAL

  function confirmarAprobacion() {
    const valor = Number(nota)
    if (!Number.isInteger(valor) || valor < 1 || valor > 10) {
      setError('La nota tiene que ser un número entero del 1 al 10')
      return
    }
    if (valor < notaMinima) {
      setError(
        promociona
          ? `Para promocionar hace falta un ${notaMinima} o más. Con menos nota te queda rendir el final.`
          : `Para aprobar el final hace falta un ${notaMinima} o más.`,
      )
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

  // Una materia bloqueada no admite ninguna transición todavía; el motivo
  // se explica en el panel.
  if (materia.estado === 'bloqueada') return null

  if (pidiendoNota) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`nota-${materia.materia_id}`} className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Nota <span className="font-normal text-slate-400 dark:text-slate-500">(del {notaMinima} al 10)</span>
          </label>
          <input
            id={`nota-${materia.materia_id}`}
            type="number"
            min={notaMinima}
            max={10}
            value={nota}
            onChange={(event) => setNota(event.target.value)}
            className="w-16 min-h-10 sm:min-h-0 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-900 dark:text-slate-100 focus:border-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            disabled={procesando}
            onClick={confirmarAprobacion}
            className={`${TACTIL} rounded-md bg-slate-900 dark:bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-white dark:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60`}
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
        {error && <p className="mt-2 text-xs text-[#d03b3b] dark:text-[#f87171]">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {materia.estado === 'disponible' && (
          <button
            type="button"
            disabled={procesando}
            onClick={() => cambiarEstado('cursando')}
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
              onClick={() => cambiarEstado('regular')}
              className={estilosBotonSecundario}
            >
              Marcar regular
            </button>
            {materia.puede_promocionar && (
              <button
                type="button"
                disabled={procesando}
                onClick={() => {
                  setError(null)
                  setNota('')
                  setPidiendoNota(true)
                }}
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
            onClick={() => {
              setError(null)
              setNota('')
              setPidiendoNota(true)
            }}
            className={estilosBotonAprobar}
          >
            Aprobar (rendí el final)
          </button>
        )}

        {(materia.estado === 'cursando' || materia.estado === 'regular') && (
          <button
            type="button"
            disabled={procesando}
            onClick={() => cambiarEstado('libre')}
            className={estilosBotonSecundario}
          >
            Marcar libre
          </button>
        )}

        {materia.estado !== 'disponible' && (
          <button
            type="button"
            disabled={procesando}
            onClick={corregir}
            className={estilosBotonCorregir}
          >
            Corregir carga
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-[#d03b3b] dark:text-[#f87171]">{error}</p>}
    </div>
  )
}

export default AccionesMateria
