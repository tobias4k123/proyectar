import { CheckCircle2, BadgeCheck, Clock, Circle, Lock } from 'lucide-react'

// Los 5 estados reales que calcula el backend (backend/app/grafo.py).
// Config compartida por el grafo (MateriaNode/EstadoLegend) y el
// historial (Historial.jsx), para no repetir colores/íconos en varios
// lugares y que quede todo consistente si se ajusta la paleta.
export const ESTADO_CONFIG = {
  aprobada: {
    label: 'Aprobada',
    icon: CheckCircle2,
    border: 'border-[#0ca30c]',
    bg: 'bg-[#0ca30c]/10',
    text: 'text-[#0ca30c]',
  },
  regular: {
    label: 'Regular',
    icon: BadgeCheck,
    border: 'border-[#2a78d6]',
    bg: 'bg-[#2a78d6]/10',
    text: 'text-[#2a78d6]',
  },
  cursando: {
    label: 'Cursando',
    icon: Clock,
    border: 'border-[#c98500]',
    bg: 'bg-[#fab219]/15',
    text: 'text-[#946200]',
  },
  disponible: {
    label: 'Disponible',
    icon: Circle,
    border: 'border-slate-400',
    bg: 'bg-white',
    text: 'text-slate-600',
  },
  bloqueada: {
    label: 'Bloqueada',
    icon: Lock,
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    text: 'text-slate-400',
  },
}

export function configDeEstado(estado) {
  return ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.bloqueada
}
