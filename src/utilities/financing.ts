/**
 * Financiamiento / cuotas — el driver #1 de conversión en Honduras.
 * Mostramos "desde L X/mes" en cada tarjeta y en la PDP (lo que la competencia local esconde).
 *
 * Por ahora el cálculo es informativo (cuotas sin intereses con tarjetas participantes).
 * Cuando se integre el provider bancario / BNPL, basta con ajustar las tasas aquí.
 */

export type FinancingPlan = {
  months: number
  /** Tasa de interés ANUAL (0 = sin intereses). */
  interest: number
}

/** Planes ofrecidos (0% con tarjetas participantes — patrón BAC/Ficohsa/Atlántida en HN). */
export const FINANCING_PLANS: FinancingPlan[] = [
  { months: 3, interest: 0 },
  { months: 6, interest: 0 },
  { months: 12, interest: 0 },
]

/** Monto mínimo (HNL) para ofrecer financiamiento. */
export const MIN_FINANCING_AMOUNT = 3000

/** Cuota mensual para un precio y un plan. */
export function monthlyPayment(price: number, plan: FinancingPlan): number {
  if (!price || plan.months <= 0) return 0
  if (plan.interest <= 0) return price / plan.months
  const r = plan.interest / 100 / 12
  return (price * r) / (1 - Math.pow(1 + r, -plan.months))
}

/** Cuota más baja disponible (mayor plazo) + su plan. Null si el precio no califica. */
export function startingMonthly(
  price?: number | null,
): { amount: number; months: number } | null {
  if (!price || price < MIN_FINANCING_AMOUNT) return null
  let best: { amount: number; months: number } | null = null
  for (const plan of FINANCING_PLANS) {
    const amount = monthlyPayment(price, plan)
    if (!best || amount < best.amount) best = { amount, months: plan.months }
  }
  return best
}

/** Tabla de cuotas para mostrar en el modal de la PDP. */
export function financingTable(price?: number | null) {
  if (!price || price < MIN_FINANCING_AMOUNT) return []
  return FINANCING_PLANS.map((plan) => ({
    months: plan.months,
    interest: plan.interest,
    monthly: monthlyPayment(price, plan),
    total: monthlyPayment(price, plan) * plan.months,
  }))
}
