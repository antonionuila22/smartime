'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { medusa } from '@/lib/medusa/sdk'
import { useCart } from '@/providers/Cart'

export default function RegistroPage() {
  const router = useRouter()
  const { count, claimForCustomer } = useCart()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setLoading(false)
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/cuenta'
      router.push(redirect)
      router.refresh()
    } catch {
      setLoading(false)
      setError(isNew ? 'No se pudo iniciar sesión.' : 'Ese correo ya está registrado.')
    }
  }

  return (
    <div className="container flex justify-center py-16">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Crear cuenta</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Regístrate para comprar más rápido.</p>

        {count > 0 && (
          <p className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
            Tienes {count} {count === 1 ? 'producto' : 'productos'} en tu carrito — crea tu cuenta
            para finalizar la compra sin perderlos.
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
