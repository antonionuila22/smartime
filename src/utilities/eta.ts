/**
 * Fecha estimada de entrega (ETA) para Honduras.
 *
 * TODO el cálculo se ancla a la hora de Honduras (UTC-6, sin horario de verano) y se FORMATEA
 * en UTC, de modo que la fecha mostrada es la MISMA en cualquier zona horaria (servidor,
 * navegador del cliente o del operador) y coincide con la ETA CONGELADA por el subscriber
 * backend `order.placed` (medusa/src/subscribers/order-placed-eta.ts). Así el fallback y la ETA
 * congelada nunca muestran fechas distintas para el mismo pedido.
 *
 * Fuentes de la ETA, en orden de prioridad (ver /cuenta y /checkout/confirmacion):
 *   1. `order.metadata.eta` (congelada al colocar el pedido)      → etaFromOrderMetadata
 *   2. `shipping_option.data` { eta_min_dias, eta_max_dias }       → etaFromShippingData
 *   3. nombre del método (mapa, coincide con el seed)              → etaForMethodName
 *
 * Se calcula hoy + N días HÁBILES (excluye sábados y domingos). Los feriados de Honduras se
 * omiten en el MVP (TRD §6.2, Opción A).
 */

export type EtaData = { eta_min_dias?: number | null; eta_max_dias?: number | null }
export type Eta = { minDate: Date; maxDate: Date; label: string } | null

// Honduras = UTC-6, sin horario de verano.
const HN_OFFSET_MS = 6 * 60 * 60 * 1000

// Formateador ÚNICO: día y mes en es-HN, en UTC. Las fechas se calculan como mediodía UTC del
// día-calendario HN, así que formatearlas en UTC da siempre el día correcto (sin off-by-one).
const fmtUtc = new Intl.DateTimeFormat('es-HN', { day: 'numeric', month: 'long', timeZone: 'UTC' })

/** Mediodía UTC del día-calendario de Honduras correspondiente a `instant`. */
function hnCalendarNoonUtc(instant: Date): Date {
  const hn = new Date(instant.getTime() - HN_OFFSET_MS) // getters UTC ⇒ reloj de pared HN
  return new Date(Date.UTC(hn.getUTCFullYear(), hn.getUTCMonth(), hn.getUTCDate(), 12, 0, 0))
}

/** Suma `n` días hábiles (lun–vie) en UTC. `from` debe ser mediodía UTC de un día HN. */
function addBusinessDaysUtc(from: Date, n: number): Date {
  const d = new Date(from)
  let added = 0
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1)
    const day = d.getUTCDay() // 0 = domingo, 6 = sábado
    if (day !== 0 && day !== 6) added++
  }
  return d
}

/** Etiqueta legible en es-HN a partir de dos fechas (ya calculadas como mediodía UTC). */
function labelFor(minDate: Date, maxDate: Date): string {
  const sameDay = minDate.toISOString().slice(0, 10) === maxDate.toISOString().slice(0, 10)
  return sameDay
    ? `Llega el ${fmtUtc.format(maxDate)}`
    : `Llega entre el ${fmtUtc.format(minDate)} y el ${fmtUtc.format(maxDate)}`
}

/**
 * (1) ETA CONGELADA en el pedido — FUENTE AUTORITATIVA. El subscriber `order.placed` guarda en
 * `order.metadata.eta` fechas absolutas (mediodía UTC): { min_date, max_date, min_dias, ... }.
 * Aquí solo se formatean (en UTC), así que nunca se mueven. Devuelve `null` si el pedido no
 * tiene ETA congelada (p. ej. pedidos previos al subscriber) → se cae al fallback.
 */
export function etaFromOrderMetadata(metadata: unknown): Eta {
  const eta = (metadata as { eta?: { min_date?: unknown; max_date?: unknown } } | null | undefined)?.eta
  // Validar el TIPO además de la presencia: un valor no-string (corrupción externa) haría
  // fallar el formateo. Ante datos inesperados devolvemos null y dejamos actuar al fallback.
  if (typeof eta?.min_date !== 'string' || typeof eta?.max_date !== 'string') return null
  const minDate = new Date(eta.min_date)
  const maxDate = new Date(eta.max_date)
  if (Number.isNaN(minDate.getTime()) || Number.isNaN(maxDate.getTime())) return null
  return { minDate, maxDate, label: labelFor(minDate, maxDate) }
}

// Mapa por NOMBRE (coincide con seed-fulfillment-hn.ts). Se usa cuando el pedido no expone
// `shipping_option.data` (el proveedor de fulfillment manual no lo conserva en el pedido).
const ETA_BY_METHOD: Record<string, EtaData> = {
  'envio estandar honduras': { eta_min_dias: 2, eta_max_dias: 4 },
  'retiro en tienda': { eta_min_dias: 1, eta_max_dias: 2 },
}

function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/** (3) Fallback por NOMBRE del método de envío. */
export function etaForMethodName(name: string | undefined | null, base: Date = new Date()): Eta {
  if (!name) return null
  return etaFromShippingData(ETA_BY_METHOD[normalizeName(name)], base)
}

/**
 * (2) ETA a partir de `shipping_option.data` { eta_min_dias, eta_max_dias }: `base` + N días
 * hábiles, anclada al calendario de Honduras. Usa la MISMA lógica que el subscriber, así que el
 * fallback y la ETA congelada coinciden exactamente para el mismo pedido. `base` por defecto =
 * ahora (para estimaciones "desde hoy", p. ej. la vista previa de envíos en el checkout).
 */
export function etaFromShippingData(data: unknown, base: Date = new Date()): Eta {
  const d = (data ?? {}) as EtaData
  const min = Number(d.eta_min_dias)
  const max = Number(d.eta_max_dias)
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) return null

  const cursor = hnCalendarNoonUtc(base)
  const minDate = addBusinessDaysUtc(cursor, min)
  const maxDate = addBusinessDaysUtc(cursor, max)
  return { minDate, maxDate, label: labelFor(minDate, maxDate) }
}

/** Forma mínima de pedido que necesita `resolveOrderEta` (compatible con la respuesta del Store API). */
export type OrderLikeForEta = {
  metadata?: unknown
  created_at?: string | null
  shipping_methods?: Array<{
    name?: string | null
    data?: Record<string, unknown> | null
    shipping_option?: { data?: unknown } | null
  }> | null
}

/**
 * ETA de un PEDIDO ya colocado: la cadena de prioridad COMPLETA en UN solo lugar (antes se
 * re-escribía —con `any`— en /checkout/confirmacion, /cuenta y /cuenta/pedidos/[id]; una
 * divergencia mostraba fechas distintas para el mismo pedido).
 *   1. `metadata.eta` congelada (autoritativa)
 *   2. `shipping_option.data` (se prefiere `method.data` si el proveedor lo conservó; si no, el de
 *      la opción)
 *   3. nombre del método (mapa espejo del seed)
 * Base = FECHA DEL PEDIDO (no "ahora"), para coincidir exactamente con la ETA congelada.
 */
export function resolveOrderEta(order: OrderLikeForEta): Eta {
  const method = order.shipping_methods?.[0]
  const base = order.created_at ? new Date(order.created_at) : new Date()
  const methodData =
    method?.data && Object.keys(method.data).length ? method.data : method?.shipping_option?.data
  return (
    etaFromOrderMetadata(order.metadata) ??
    etaFromShippingData(methodData, base) ??
    etaForMethodName(method?.name, base)
  )
}
