import React from 'react'
import { BadgeCheck, CreditCard, RotateCcw, Truck } from 'lucide-react'

const ITEMS = [
  { icon: BadgeCheck, title: 'Originales y sellados', desc: 'Garantía y factura incluidas' },
  { icon: CreditCard, title: 'Cuotas sin intereses', desc: 'Hasta 12 meses con tarjeta' },
  { icon: Truck, title: 'Envío a todo el país', desc: '2-4 días hábiles, o retiro en tienda' },
  { icon: RotateCcw, title: 'Devolución 7 días', desc: 'Compra con confianza' },
]

export const TrustBand: React.FC = () => {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="container grid grid-cols-2 gap-3 py-12 md:grid-cols-4 md:gap-4 md:py-16">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="group flex items-center gap-3 rounded-2xl border border-transparent bg-card/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
