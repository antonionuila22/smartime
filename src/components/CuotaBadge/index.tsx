'use client'

import React, { useState } from 'react'
import { CreditCard, X } from 'lucide-react'

import { cn } from '@/utilities/ui'
import { formatPrice } from '@/utilities/format'
import { financingTable, startingMonthly } from '@/utilities/financing'

/**
 * "Desde L X/mes" — visible en tarjetas y PDP.
 * compact → línea pequeña para ProductCard.
 * full → caja destacada (con modal de tabla de cuotas) para la PDP.
 */
export const CuotaBadge: React.FC<{ price?: number | null; variant?: 'compact' | 'full' }> = ({
  price,
  variant = 'compact',
}) => {
  const [open, setOpen] = useState(false)
  const start = startingMonthly(price)
  if (!start) return null

  const table = financingTable(price)

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className="mt-0.5 inline-flex items-center gap-1 rounded-full text-left text-xs text-primary transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <CreditCard className="size-3.5 shrink-0" aria-hidden />o desde{' '}
        <span className="font-semibold">{formatPrice(start.amount)}/mes</span>
        {open && <Modal table={table} onClose={() => setOpen(false)} />}
      </button>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
      <div className="flex items-center gap-2.5 text-sm">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <CreditCard className="size-4" aria-hidden />
        </span>
        <span className="leading-snug">
          Págalo en cuotas desde{' '}
          <span className="font-bold text-primary">{formatPrice(start.amount)}/mes</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1 rounded-full text-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Ver planes de financiamiento →
      </button>
      <p className="mt-1 text-[11px] text-muted-foreground">
        0% interés con tarjetas participantes · sujeto a aprobación
      </p>
      {open && <Modal table={table} onClose={() => setOpen(false)} />}
    </div>
  )
}

const Modal: React.FC<{
  table: ReturnType<typeof financingTable>
  onClose: () => void
}> = ({ table, onClose }) => (
  <div
    className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4"
    onClick={(e) => {
      e.stopPropagation()
      onClose()
    }}
  >
    <div
      className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Planes de cuotas</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="size-4" />
        </button>
      </div>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Plazo</th>
            <th className="pb-2 text-right font-medium">Cuota/mes</th>
            <th className="pb-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row) => (
            <tr key={row.months} className="border-b last:border-0">
              <td className="py-2.5">
                {row.months} meses
                {row.interest === 0 && (
                  <span className="ml-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                    0%
                  </span>
                )}
              </td>
              <td className="py-2.5 text-right font-semibold">{formatPrice(row.monthly)}</td>
              <td className="py-2.5 text-right text-muted-foreground">{formatPrice(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Cuotas sin intereses con tarjetas de crédito participantes (BAC, Ficohsa, Atlántida,
        Banpaís). Sujeto a aprobación del banco emisor. Los valores son una estimación.
      </p>
    </div>
  </div>
)
