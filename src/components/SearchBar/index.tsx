'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, Search, SearchX } from 'lucide-react'

import { medusa } from '@/lib/medusa/sdk'
import { useDebounce } from '@/utilities/useDebounce'
import { cn } from '@/utilities/ui'

type Suggestion = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
  category?: string | null
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const SearchBar: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const debounced = useDebounce(q, 250)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const term = debounced.trim()
    if (term.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    medusa.store.product
      .list({ q: term, limit: 6, fields: 'id,title,handle,thumbnail,*categories' })
      .then(({ products }) => {
        if (!active) return
        setSuggestions(
          (products as any[]).map((p) => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
            thumbnail: p.thumbnail,
            category: p.categories?.[0]?.name ?? null,
          })),
        )
        setLoading(false)
      })
      .catch(() => {
        if (active) {
          setSuggestions([])
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [debounced])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const goSearch = () => {
    const t = q.trim()
    setOpen(false)
    router.push(t ? `/tienda?q=${encodeURIComponent(t)}` : '/tienda')
  }
  const goProduct = (handle: string) => {
    setOpen(false)
    setQ('')
    router.push(`/producto/${handle}`)
  }

  const showDropdown = open && q.trim().length >= 2

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          goSearch()
        }}
        role="search"
      >
        <div className="relative flex w-full items-center">
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar Mac, iPhone, accesorios…"
            aria-label="Buscar productos"
            autoComplete="off"
            className="h-12 w-full rounded-full border border-input bg-background pl-5 pr-14 text-sm outline-none transition duration-300 hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-1.5 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95"
          >
            <Search className="size-4" />
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {loading && suggestions.length === 0 ? (
            <div className="flex items-center gap-2.5 px-4 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" aria-hidden /> Buscando…
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-[60vh] overflow-auto p-1.5">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goProduct(s.handle)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-300 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
                  >
                    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white">
                      {s.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.thumbnail} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <Search className="size-4 text-muted-foreground" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{s.title}</span>
                      {s.category && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {s.category}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
              <li className="mt-1.5 border-t border-border pt-1.5">
                <button
                  type="button"
                  onClick={goSearch}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors duration-300 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
                >
                  <span className="truncate">Ver todos los resultados de «{q.trim()}»</span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </button>
              </li>
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <span className="grid size-11 place-items-center rounded-full border border-border bg-background">
                <SearchX className="size-5 text-muted-foreground/70" aria-hidden />
              </span>
              <p className="text-sm font-medium">Sin resultados para «{q.trim()}»</p>
              <p className="text-xs text-muted-foreground">
                Prueba con otra palabra, por ejemplo «MacBook» o «iPhone».
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
