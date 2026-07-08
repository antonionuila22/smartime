/**
 * Señal ligera de cambios de sesión (login / registro / logout) para que la UI persistente
 * (el header, que vive entre navegaciones cliente) refresque su estado sin recargar la página.
 * Sin contexto ni librerías: un CustomEvent en window basta para este caso.
 */
export const AUTH_CHANGED_EVENT = 'smartime:auth-changed'

export function emitAuthChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
  }
}
