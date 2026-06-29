'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={loading}>
      <LogOut className="size-4" /> Cerrar sesión
    </Button>
  )
}
