import { CheckCircle2, BadgeCheck, Clock, Circle, Lock } from 'lucide-react'

// Los 5 estados reales que calcula el backend (backend/app/grafo.py).
// Config compartida por todo lo que muestra una materia -- el mapa, su
// panel, la vista de lista y la leyenda -- para no repetir colores e
// íconos en varios lugares y que quede todo consistente si se ajusta la
// paleta.
//
// En modo oscuro los colores no se invierten: se usan versiones más claras
// del mismo color, porque un verde o un azul saturados sobre fondo oscuro
// pierden contraste y se leen peor que sobre fondo blanco.
export const ESTADO_CONFIG = {
  aprobada: {
    label: 'Aprobada',
    icon: CheckCircle2,
    border: 'border-[#0ca30c] dark:border-[#4ade80]/60',
    bg: 'bg-[#0ca30c]/10 dark:bg-[#4ade80]/10',
    text: 'text-[#0ca30c] dark:text-[#4ade80]',
  },
  regular: {
    label: 'Regular',
    icon: BadgeCheck,
    border: 'border-[#2a78d6] dark:border-[#60a5fa]/60',
    bg: 'bg-[#2a78d6]/10 dark:bg-[#60a5fa]/10',
    text: 'text-[#2a78d6] dark:text-[#60a5fa]',
  },
  cursando: {
    label: 'Cursando',
    icon: Clock,
    border: 'border-[#c98500] dark:border-[#fbbf24]/60',
    bg: 'bg-[#fab219]/15 dark:bg-[#fbbf24]/10',
    text: 'text-[#946200] dark:text-[#fbbf24]',
  },
  disponible: {
    label: 'Disponible',
    icon: Circle,
    border: 'border-slate-400 dark:border-slate-600',
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-slate-600 dark:text-slate-300',
  },
  bloqueada: {
    label: 'Bloqueada',
    icon: Lock,
    border: 'border-slate-200 dark:border-slate-800',
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    text: 'text-slate-400 dark:text-slate-500',
  },
}

export function configDeEstado(estado) {
  return ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.bloqueada
}
