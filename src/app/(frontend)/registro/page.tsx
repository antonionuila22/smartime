'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Eye, EyeOff, Loader2, ShoppingBag } from 'lucide-react'

import { InlineError } from '@/components/ui/inline-error'

import { Button } from '@/components/ui/button'
import { emitAuthChanged } from '@/lib/authEvents'
import { medusa } from '@/lib/medusa/sdk'
import { useCart } from '@/providers/Cart'

export default function RegistroPage() {
  const router = useRouter()
  const { count, claimForCustomer } = useCart()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Controla el toggle de mostrar/ocultar contraseña (mejora UX, evita errores de tecleo).
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)

    let isNew = true
    try {
      await medusa.auth.register('customer', 'emailpass', { email, password })
    } catch {
      // La identidad ya existe: intentaremos iniciar sesión directamente.
      isNew = false
    }

    if (isNew) {
      try {
        await medusa.store.customer.create({ email, first_name: name })
      } catch {
        /* el perfil puede crearse luego */
      }
    }

    try {
      const res = await medusa.auth.login('customer', 'emailpass', { email, password })
      if (typeof res !== 'string') {
        setLoading(false)
        setError('No se pudo iniciar sesión.')
        return
      }
      // Conserva el carrito anónimo asociándolo a la cuenta nueva (no pierde productos).
      await claimForCustomer()
      // Avisa a la UI persistente (header) de que la sesión cambió, sin recarga completa.
      emitAuthChanged()
      setLoading(false)
      // Seguridad: solo aceptamos rutas internas (un único '/', ni '//' ni '/\') para evitar open redirect.
      const redirect = new URLSearchParams(window.location.search).get('redirect')
      const safe = /^\/(?![/\\])/.test(redirect || '') ? (redirect as string) : '/cuenta'
      router.push(safe)
      router.refresh()
    } catch {
      setLoading(false)
      setError(isNew ? 'No se pudo iniciar sesión.' : 'Ese correo ya está registrado.')
    }
  }

  return (
    <div className="container flex justify-center py-12 md:py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {/* Cabecera de la tarjeta */}
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tu cuenta</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">Crear cuenta</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Regístrate para comprar más rápido.</p>

        {count > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary">
            <ShoppingBag className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Tienes {count} {count === 1 ? 'producto' : 'productos'} en tu carrito — crea tu
              cuenta para finalizar la compra sin perderlos.
            </span>
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="given-name"
              name="given-name"
              placeholder="¿Cómo te llamas?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition duration-300 placeholder:text-muted-foreground/60 hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              name="email"
              placeholder="nombre@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition duration-300 placeholder:text-muted-foreground/60 hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            {/* Campo con botón para mostrar/ocultar la contraseña (accesible y sin enviar el form). */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background pl-3 pr-10 text-sm outline-none transition duration-300 placeholder:text-muted-foreground/60 hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="absolute right-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Debe tener al menos 6 caracteres.</p>
          </div>

          <InlineError variant="banner">{error}</InlineError>

          <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Crear cuenta
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
