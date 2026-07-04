import React from 'react'
import { Star } from 'lucide-react'

import { cn } from '@/utilities/ui'

export const ReviewStars: React.FC<{
  rating: number
  count?: number
  size?: 'sm' | 'md'
  showCount?: boolean
  className?: string
}> = ({ rating, count, size = 'sm', showCount = true, className }) => {
  const full = Math.round(rating)
  const px = size === 'md' ? 'size-4' : 'size-3.5'
  return (
    <div
      role="img"
      className={cn('flex items-center gap-1.5', className)}
      aria-label={`Calificación ${rating.toFixed(1)} de 5`}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={cn(
              px,
              i <= full ? 'fill-warning text-warning' : 'fill-muted text-muted-foreground/30',
            )}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {rating.toFixed(1)}
          {typeof count === 'number' ? ` (${count})` : ''}
        </span>
      )}
    </div>
  )
}
