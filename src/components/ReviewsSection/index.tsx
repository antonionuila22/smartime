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
    <section id="reviews" className="mt-14 border-t pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Opiniones de clientes</h2>
          {total > 0 ? (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-bold tabular-nums leading-none">{avg.toFixed(1)}</span>
              <div className="space-y-0.5">
                <ReviewStars rating={avg} showCount={false} size="md" />
                <p className="text-xs text-muted-foreground">
                  Basado en {total} {total === 1 ? 'opinión' : 'opiniones'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Aún no hay opiniones. ¡Sé el primero en opinar!
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowForm((v) => !v)}>
          Escribir una reseña
        </Button>
      </div>

      {showForm && <ReviewForm productId={productId} onDone={refresh} />}

      <ul className="mt-8 space-y-6">
        {reviews.map((r) => (
          <li key={r.id} className="border-b pb-6 last:border-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {r.first_name} {r.last_name}
                </span>
                {r.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                    <BadgeCheck className="size-3.5" aria-hidden /> Compra verificada
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span>
            </div>
            <ReviewStars rating={r.rating} showCount={false} className="mt-1.5" />
            {r.title && <p className="mt-2 font-medium">{r.title}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{r.content}</p>
          </li>
        ))}
      </ul>
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
    <form onSubmit={submit} className="mt-6 rounded-xl border bg-muted/30 p-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Tu calificación:</span>
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              aria-label={`${i} ${i === 1 ? 'estrella' : 'estrellas'}`}
              className="rounded-full p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Star
                className={cn(
                  'size-6 transition-colors',
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
        className="mt-4 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Cuéntanos tu experiencia con este producto…"
        rows={4}
        className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
