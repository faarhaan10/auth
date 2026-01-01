"use client"
import React from 'react'
import { usePathname } from 'next/navigation'

export default function DefaultPage() {
    const path = usePathname(); 
  return (
    <div className="h-[100%] flex items-center justify-center">
        <h4 className='text-2xl font-bold text-center'>This is {path} page</h4>
    </div>
  )
}
