'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

const OPTIONS = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'rating', label: 'Mejor valorados' },
]

export const SortSelect: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const current = sp.get('orden') || 'relevancia'

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = new URLSearchParams(sp.toString())
    if (e.target.value === 'relevancia') p.delete('orden')
    else p.set('orden', e.target.value)
    const qs = p.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted-foreground sm:inline">Ordenar:</span>
      <select
        value={current}
        onChange={onChange}
        className="cursor-pointer rounded-full border border-input bg-card px-4 py-2 text-sm font-medium text-foreground outline-none transition-colors hover:border-primary/40 hover:bg-accent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
