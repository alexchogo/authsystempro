'use client'

import React from 'react'
import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-10 w-10" />
        <p className="text-sm text-muted-foreground">Getting things ready for you…</p>
      </div>
    </div>
  )
}
