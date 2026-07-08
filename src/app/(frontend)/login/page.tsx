'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { AlertCircle, Loader2, ShoppingBag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { emitAuthChanged } from '@/lib/authEvents'
import { medusa } from '@/lib/medusa/sdk'
import { useCart } from '@/providers/Cart'

export default function LoginPage() {
  const router = useRouter()
  const { count, claimForCustomer } = useCart()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await medusa.auth.login('customer', 'emailpass', { email, password })
      if (typeof res !== 'string') {
        setLoading(false)
        setError('No se pudo iniciar sesión.')
        return
      }
      // Conserva el carrito anónimo asociándolo a la cuenta.
      await claimForCustomer()
      // Avisa a la UI persistente (header) de que la sesión cambió, sin recarga completa.
      emitAuthChanged()
      // Seguridad: solo aceptamos rutas internas (un único '/', ni '//' ni '/\') para evitar open redirect.
      const redirect = new URLSearchParams(window.location.search).get('redirect')
      const safe = /^\/(?![/\\])/.test(redirect || '') ? (redirect as string) : '/cuenta'
      router.push(safe)
      router.refresh()
    } catch {
      setLoading(false)
      setError('Correo o contraseña incorrectos.')
    }
  }

  return (
    <div className="container flex justify-center py-12 md:py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {/* Cabecera de la tarjeta */}
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tu cuenta</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Accede a tu cuenta de smartime.</p>

        {count > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary">
            <ShoppingBag className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Tienes {count} {count === 1 ? 'producto' : 'productos'} en tu carrito — inicia sesión
              para conservarlos.
            </span>
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nombre@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition duration-300 placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition duration-300 placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Entrar
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link
            href="/registro"
            className="rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  )
}
