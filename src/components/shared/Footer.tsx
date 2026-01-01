import { Snail } from 'lucide-react'
import React from 'react'
import Logo from './Logo'

export default function Footer() {
  return (
    <p className='text-center text-sm text-muted-foreground py-3 flex gap-2 justify-center items-center border-t border-gray-200'>
        &copy; {new Date().getFullYear()} <Logo/> All rights reserved.
    </p>
  )
}
