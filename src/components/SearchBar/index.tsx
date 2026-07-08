'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useId, useRef, useState } from 'react'
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
  // a11y (combobox): índice de la opción resaltada (-1 = ninguna) e id estable del listbox
  const [activeIndex, setActiveIndex] = useState(-1)
  const listboxId = useId()

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
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        // a11y: al cerrar por click-fuera limpiamos la opción resaltada (evita resaltados obsoletos al reabrir)
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const goSearch = () => {
    const t = q.trim()
    setOpen(false)
    setActiveIndex(-1)
    router.push(t ? `/tienda?q=${encodeURIComponent(t)}` : '/tienda')
  }
  const goProduct = (handle: string) => {
    setOpen(false)
    setActiveIndex(-1)
    setQ('')
    router.push(`/producto/${handle}`)
  }

  const showDropdown = open && q.trim().length >= 2
  // a11y: el listbox solo existe (y "expande" el combobox) cuando hay opciones renderizadas
  const listboxVisible = showDropdown && suggestions.length > 0

  // a11y (teclado combobox): flechas mueven el resaltado con wrap, Enter activa, Escape cierra
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return
    // opciones navegables: sugerencias + la fila final «Ver todos» (solo si hay sugerencias)
    const count = suggestions.length > 0 ? suggestions.length + 1 : 0
    switch (e.key) {
      case 'ArrowDown':
        if (count === 0) return
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % count)
        break
      case 'ArrowUp':
        if (count === 0) return
        e.preventDefault()
        setActiveIndex((i) => (i <= 0 ? count - 1 : i - 1))
        break
      case 'Enter':
        // si hay opción resaltada la activamos; si no, dejamos que el form haga la búsqueda general
        if (activeIndex >= 0 && activeIndex < count) {
          e.preventDefault()
          if (activeIndex < suggestions.length) goProduct(suggestions[activeIndex].handle)
          else goSearch()
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setActiveIndex(-1)
        break
      default:
        break
    }
  }

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
              setActiveIndex(-1)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Buscar productos y marcas…"
            aria-label="Buscar productos"
            autoComplete="off"
            role="combobox"
            aria-expanded={listboxVisible}
            aria-controls={listboxVisible ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
            }
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
            <ul
              role="listbox"
              id={listboxId}
              aria-label="Sugerencias de productos"
              className="max-h-[60vh] overflow-auto p-1.5"
            >
              {suggestions.map((s, index) => (
                <li key={s.id} role="presentation">
                  <button
                    type="button"
                    id={`${listboxId}-opt-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onClick={() => goProduct(s.handle)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-300 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                      activeIndex === index && 'bg-accent',
                    )}
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
              <li className="mt-1.5 border-t border-border pt-1.5" role="presentation">
                <button
                  type="button"
                  id={`${listboxId}-opt-${suggestions.length}`}
                  role="option"
                  aria-selected={activeIndex === suggestions.length}
                  onClick={goSearch}
                  onMouseEnter={() => setActiveIndex(suggestions.length)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors duration-300 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                    activeIndex === suggestions.length && 'bg-accent',
                  )}
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
