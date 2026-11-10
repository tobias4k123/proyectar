// Modo claro / oscuro.
//
// La primera vez se respeta lo que tenga configurado el sistema; a partir
// de que el alumno elige, manda su elección y queda guardada. La clase se
// aplica sobre <html> y Tailwind la toma desde ahí (ver index.css).
//
// El valor se lee también en un script dentro de index.html, antes de que
// cargue la aplicación: si se esperara a React, la pantalla aparecería un
// instante en claro antes de pasar a oscuro.

export const CLAVE_TEMA = 'proyectar-tema'

export function temaGuardado() {
  try {
    return localStorage.getItem(CLAVE_TEMA)
  } catch {
    // Modo privado o almacenamiento bloqueado: se sigue con la preferencia
    // del sistema, sin recordar la elección.
    return null
  }
}

export function temaInicial() {
  return (
    temaGuardado() ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro')
  )
}

export function aplicarTema(tema) {
  document.documentElement.classList.toggle('dark', tema === 'oscuro')
  try {
    localStorage.setItem(CLAVE_TEMA, tema)
  } catch {
    // Si no se puede guardar, el tema igual queda aplicado en esta visita.
  }
}
