import { cn } from '@/lib/utils'
import { Snail } from 'lucide-react'
import React from 'react'

export default function Logo({size,className}: {size?: number, className?: string}) {
  return (
    <><Snail className={cn('text-rose-600',className)} size={size}/></>
  )
}
