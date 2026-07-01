import React from 'react'
import { BadgeCheck, CreditCard, RotateCcw, Truck } from 'lucide-react'

const ITEMS = [
  { icon: BadgeCheck, title: 'Apple original y sellado', desc: 'Garantía y factura incluidas' },
  { icon: CreditCard, title: 'Cuotas sin intereses', desc: 'Hasta 12 meses con tarjeta' },
  { icon: Truck, title: 'Envío 24-48h o retiro', desc: 'Tegucigalpa, SPS y todo el país' },
  { icon: RotateCcw, title: 'Devolución 7 días', desc: 'Compra con confianza' },
]

export const TrustBand: React.FC = () => {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="container grid grid-cols-2 gap-4 py-10 md:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="group flex items-center gap-3 rounded-xl border border-transparent bg-card/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-lg"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
