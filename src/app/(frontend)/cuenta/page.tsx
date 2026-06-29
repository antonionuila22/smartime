'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Mail, Package, User as UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/account/LogoutButton'
import { medusa } from '@/lib/medusa/sdk'

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CuentaPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    medusa.store.customer
      .retrieve()
      .then(({ customer }) => {
        setCustomer(customer)
        setLoading(false)
      })
      .catch(() => router.replace('/login?redirect=/cuenta'))
  }, [router])

  if (loading) return <div className="container min-h-[40vh] py-20" />
  if (!customer) return null

  const name = customer.first_name || customer.email?.split('@')[0]

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="size-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hola, {name}</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-4" /> {customer.email}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 font-semibold">
              <Package className="size-5 text-primary" /> Mis pedidos
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Aquí verás el historial de tus compras al activar el checkout.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/tienda">Ir a comprar</Link>
            </Button>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 font-semibold">
              <UserIcon className="size-5 text-primary" /> Datos de la cuenta
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nombre</dt>
                <dd className="font-medium">{name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Correo</dt>
                <dd className="font-medium">{customer.email}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
