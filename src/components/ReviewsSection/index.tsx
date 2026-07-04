'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Loader2, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReviewStars } from '@/components/ReviewStars'
import { medusa } from '@/lib/medusa/sdk'
import type { ReviewItem } from '@/lib/medusa/types'
import { cn } from '@/utilities/ui'

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

export const ReviewsSection: React.FC<{
  productId: string
  initialReviews: ReviewItem[]
  average: number
  count: number
}> = ({ productId, initialReviews, average, count }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews)
  const [avg, setAvg] = useState(average)
  const [total, setTotal] = useState(count)
  const [showForm, setShowForm] = useState(false)

  const refresh = async () => {
    try {
      const res = await medusa.client.fetch<{
        reviews: ReviewItem[]
        count: number
        average_rating: number
      }>(`/store/products/${productId}/reviews`)
      setReviews(res.reviews || [])
      setTotal(res.count || 0)
      setAvg(res.average_rating || 0)
    } catch {
      /* noop */
    }
  }

  return (
    <section id="reviews" className="mt-12 scroll-mt-24 border-t border-border pt-10 md:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Reseñas</p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight">
            Opiniones de clientes
          </h2>
        </div>
        <Button variant="outline" onClick={() => setShowForm((v) => !v)}>
          Escribir una reseña
        </Button>
      </div>

      {total > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-5">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold tabular-nums leading-none tracking-tight">
              {avg.toFixed(1)}
            </span>
            <div className="space-y-1">
              <ReviewStars rating={avg} showCount={false} size="md" />
              <p className="text-xs text-muted-foreground">
                Basado en {total} {total === 1 ? 'opinión' : 'opiniones'}
              </p>
            </div>
          </div>

          {/* Distribución por estrellas (derivada de las reseñas cargadas) */}
          {reviews.length > 0 && (
            <div className="w-full max-w-xs space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = reviews.filter((r) => Math.round(r.rating) === star).length
                const pct = Math.round((n / reviews.length) * 100)
                return (
                  <div
                    key={star}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="w-3 text-right tabular-nums">{star}</span>
                    <Star className="size-3 shrink-0 fill-warning text-warning" aria-hidden />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-warning transition-[width] duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 tabular-nums">{n}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Aún no hay opiniones. ¡Sé el primero en contar tu experiencia!
        </p>
      )}

      {showForm && <ReviewForm productId={productId} onDone={refresh} />}

      {reviews.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
          <Star className="size-8 text-muted-foreground/40" strokeWidth={1.5} aria-hidden />
          <p className="text-sm text-muted-foreground">Este producto aún no tiene reseñas.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {r.first_name} {r.last_name}
                  </span>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                      <BadgeCheck className="size-3.5" aria-hidden /> Compra verificada
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {fmtDate(r.created_at)}
                </span>
              </div>
              <ReviewStars rating={r.rating} showCount={false} className="mt-2" />
              {r.title && <p className="mt-2.5 font-medium">{r.title}</p>}
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const ReviewForm: React.FC<{ productId: string; onDone: () => void }> = ({ productId, onDone }) => {
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err' | 'login'; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!content.trim()) {
      setMsg({ type: 'err', text: 'Escribe tu opinión.' })
      return
    }
    setLoading(true)
    try {
      const { customer } = await medusa.store.customer.retrieve().catch(() => ({ customer: null }))
      if (!customer) {
        setMsg({
          type: 'login',
          text: 'Inicia sesión para publicar tu reseña.',
        })
        setLoading(false)
        return
      }
      const res = await medusa.client.fetch<{ verified: boolean }>('/store/reviews', {
        method: 'POST',
        body: {
          product_id: productId,
          rating,
          title: title || undefined,
          content,
          first_name: customer.first_name || 'Cliente',
          last_name: customer.last_name || '',
        },
      })
      setTitle('')
      setContent('')
      if (res.verified) {
        setMsg({ type: 'ok', text: '¡Gracias! Tu reseña ya está publicada.' })
        onDone()
      } else {
        setMsg({
          type: 'ok',
          text: 'Gracias por tu opinión. Quedará visible una vez aprobada.',
        })
      }
    } catch {
      setMsg({ type: 'err', text: 'No se pudo enviar la reseña. Intenta de nuevo.' })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Tu calificación:</span>
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              aria-label={`${i} ${i === 1 ? 'estrella' : 'estrellas'}`}
              className="rounded-full p-1 transition-transform duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Star
                className={cn(
                  'size-6 transition-colors duration-300',
                  i <= (hover || rating)
                    ? 'fill-warning text-warning'
                    : 'fill-muted text-muted-foreground/30',
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título (opcional)"
        className="mt-4 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Cuéntanos tu experiencia con este producto…"
        rows={4}
        className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      {msg && (
        <p
          className={cn(
            'mt-3 text-sm font-medium',
            msg.type === 'ok' ? 'text-success' : msg.type === 'login' ? 'text-primary' : 'text-destructive',
          )}
        >
          {msg.text}{' '}
          {msg.type === 'login' && (
            <Link href="/login?redirect=/cuenta" className="underline">
              Iniciar sesión
            </Link>
          )}
        </p>
      )}
      <Button type="submit" className="mt-4" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Publicar reseña
      </Button>
    </form>
  )
}
