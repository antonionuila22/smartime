'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { emitAuthChanged } from '@/lib/authEvents'
import { medusa } from '@/lib/medusa/sdk'

export const LogoutButton: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
      await medusa.auth.logout()
    } catch {
      /* noop */
    }
    // Avisa a la UI persistente (header) de que la sesión cambió, sin recarga completa.
    emitAuthChanged()
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="outline" className="rounded-full" onClick={onClick} disabled={loading}>
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
      Cerrar sesión
    </Button>
  )
}
