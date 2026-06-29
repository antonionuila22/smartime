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
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              px,
              i <= full ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-muted text-muted-foreground/30',
            )}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs text-muted-foreground">
          {rating.toFixed(1)}
          {typeof count === 'number' ? ` (${count})` : ''}
        </span>
      )}
    </div>
  )
}
