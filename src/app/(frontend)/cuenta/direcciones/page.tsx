'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CircleAlert,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { medusa } from '@/lib/medusa/sdk'
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
  type CreateAddressInput,
  type CustomerAddress,
} from '@/lib/medusa/account'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Departamentos de Honduras (para el select del formulario). */
const DEPARTAMENTOS_HN = [
  'Atlántida',
  'Choluteca',
  'Colón',
  'Comayagua',
  'Copán',
  'Cortés',
  'El Paraíso',
  'Francisco Morazán',
  'Gracias a Dios',
  'Intibucá',
  'Islas de la Bahía',
  'La Paz',
  'Lempira',
  'Ocotepeque',
  'Olancho',
  'Santa Bárbara',
  'Valle',
  'Yoro',
]

/** Estado del formulario (país fijo 'hn'). */
type FormState = {
  first_name: string
  last_name: string
  phone: string
  address_1: string
  city: string
  province: string
}

const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  phone: '',
  address_1: '',
  city: '',
  province: '',
}

export default function DireccionesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [addresses, setAddresses] = useState<CustomerAddress[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Formulario: null = oculto; 'new' = añadir; string = id que se edita.
  const [editing, setEditing] = useState<'new' | string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Carga inicial: exige sesión; si no hay, redirige a login.
  useEffect(() => {
    medusa.store.customer
      .retrieve()
      .then(async () => {
        try {
          const list = await listAddresses()
          setAddresses(list)
        } catch {
          setAddresses([])
          setError('No se pudieron cargar tus direcciones. Inténtalo de nuevo.')
        }
        setLoading(false)
      })
      .catch(() => router.replace('/login?redirect=/cuenta/direcciones'))
  }, [router])

  /** Refresca la lista tras guardar o borrar. */
  async function refresh() {
    try {
      const list = await listAddresses()
      setAddresses(list)
    } catch {
      setError('No se pudieron actualizar tus direcciones.')
    }
  }

  /** Abre el formulario en modo "añadir". */
  function openNew() {
    setForm(EMPTY_FORM)
    setEditing('new')
    setError(null)
  }

  /** Abre el formulario en modo "editar" con los datos de la dirección. */
  function openEdit(addr: CustomerAddress) {
    setForm({
      first_name: addr.first_name ?? '',
      last_name: addr.last_name ?? '',
      phone: addr.phone ?? '',
      address_1: addr.address_1 ?? '',
      city: addr.city ?? '',
      province: addr.province ?? '',
    })
    setEditing(addr.id)
    setError(null)
  }

  /** Cierra el formulario sin guardar. */
  function closeForm() {
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  /** Guarda (crea o actualiza) la dirección. */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload: CreateAddressInput = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim() || undefined,
      address_1: form.address_1.trim(),
      city: form.city.trim(),
      province: form.province.trim() || undefined,
      country_code: 'hn',
    }
    try {
      if (editing === 'new') {
        await createAddress(payload)
      } else if (editing) {
        await updateAddress(editing, payload)
      }
      await refresh()
      closeForm()
    } catch {
      setError('No se pudo guardar la dirección. Revisa los datos e inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  /** Borra una dirección con confirmación simple. */
  async function onDelete(addr: CustomerAddress) {
    const label = addr.address_1 || 'esta dirección'
    if (!window.confirm(`¿Borrar «${label}»? Esta acción no se puede deshacer.`)) return
    setDeletingId(addr.id)
    setError(null)
    try {
      await deleteAddress(addr.id)
      // Si se estaba editando la que se borró, cierra el formulario.
      if (editing === addr.id) closeForm()
      await refresh()
    } catch {
      setError('No se pudo borrar la dirección. Inténtalo de nuevo.')
    } finally {
      setDeletingId(null)
    }
  }

  // Skeleton de carga
  if (loading)
    return (
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-6 flex items-center gap-4">
            <div className="size-14 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-56 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
            <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          </div>
        </div>
      </div>
    )

  return (
    <div className="container py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Volver a mi cuenta */}
        <Link
          href="/cuenta"
          className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver a mi cuenta
        </Link>

        {/* Cabecera */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
              <MapPin className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Libro de direcciones
              </p>
              <h1 className="mt-0.5 text-2xl md:text-3xl font-bold tracking-tight">
                Mis direcciones
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Guárdalas para agilizar tu próximo checkout.
              </p>
            </div>
          </div>
          {editing === null && (
            <Button onClick={openNew} className="rounded-full">
              <Plus className="size-4" aria-hidden="true" /> Añadir dirección
            </Button>
          )}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {/* Formulario de añadir/editar */}
        {editing !== null && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                {editing === 'new' ? (
                  <>
                    <Plus className="size-5 text-primary" aria-hidden="true" /> Nueva dirección
                  </>
                ) : (
                  <>
                    <Pencil className="size-5 text-primary" aria-hidden="true" /> Editar dirección
                  </>
                )}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Cerrar formulario"
                className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Nombre"
                value={form.first_name}
                onChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
                required
              />
              <Field
                label="Apellido"
                value={form.last_name}
                onChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
                required
              />
              <Field
                label="Teléfono"
                type="tel"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                className="sm:col-span-2"
              />
              <Field
                label="Dirección"
                value={form.address_1}
                onChange={(v) => setForm((f) => ({ ...f, address_1: v }))}
                required
                className="sm:col-span-2"
              />
              <Field
                label="Ciudad"
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                required
              />
              <SelectField
                label="Departamento"
                value={form.province}
                onChange={(v) => setForm((f) => ({ ...f, province: v }))}
                options={DEPARTAMENTOS_HN}
              />
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <Button type="submit" size="lg" disabled={saving} className="rounded-full">
                  {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {editing === 'new' ? 'Guardar dirección' : 'Guardar cambios'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-full"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Lista de direcciones */}
        <section className="mt-8">
          {addresses && addresses.length === 0 && editing === null ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <MapPin className="size-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm font-medium">Aún no has guardado direcciones</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Añade una dirección para que tu próximo pedido sea más rápido.
              </p>
              <Button onClick={openNew} className="mt-5 rounded-full">
                <Plus className="size-4" aria-hidden="true" /> Añadir dirección
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {(addresses ?? []).map((addr) => {
                const fullName = [addr.first_name, addr.last_name].filter(Boolean).join(' ')
                const location = [addr.city, addr.province].filter(Boolean).join(', ')
                const isDeleting = deletingId === addr.id
                return (
                  <li
                    key={addr.id}
                    className="rounded-2xl border border-border bg-card p-5 transition duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{fullName || 'Dirección'}</p>
                          {addr.is_default_shipping && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                              <Star className="size-3" aria-hidden="true" /> Predeterminada
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {addr.address_1 || 'Sin dirección'}
                        </p>
                        {location && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{location}</p>
                        )}
                        {addr.phone && (
                          <p className="mt-0.5 text-sm text-muted-foreground">Tel. {addr.phone}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(addr)}
                          disabled={isDeleting}
                          // a11y: identificar la dirección para distinguir botones iguales en la lista
                          aria-label={`Editar dirección de ${fullName || addr.address_1}`}
                          className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(addr)}
                          disabled={isDeleting}
                          // a11y: identificar la dirección para distinguir botones iguales en la lista
                          aria-label={`Borrar dirección de ${fullName || addr.address_1}`}
                          className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 className="size-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

/** Campo de texto reutilizable (mismo estilo que el checkout). */
const Field: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  className?: string
}> = ({ label, value, onChange, required, type = 'text', className }) => {
  const id = `dir-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/g, '')}`
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition duration-300 hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40"
      />
    </div>
  )
}

/** Select reutilizable para el departamento. */
const SelectField: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  className?: string
}> = ({ label, value, onChange, options, className }) => {
  const id = `dir-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/g, '')}`
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition duration-300 hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <option value="">Selecciona un departamento</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
