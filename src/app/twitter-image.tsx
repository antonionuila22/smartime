// Twitter/X reutiliza la misma imagen social (1200x630) que Open Graph. Reexportar evita
// duplicar el generador y mantiene una sola fuente de verdad para la marca.
export { default, alt, size, contentType } from './opengraph-image'
