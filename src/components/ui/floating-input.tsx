"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type FloatingInputProps = React.ComponentProps<typeof Input> & {
  label: string
  id?: string
  trailing?: React.ReactNode
}

export default function FloatingInput({ label, id, className, placeholder, trailing, ...props }: FloatingInputProps) {
  const generatedId = React.useId()
  const inputId = id ?? `floating-${generatedId}`

  // ensure there's a placeholder so `peer-placeholder-shown` works for empty inputs
  const placeholderValue = placeholder ?? " "

  return (
    <div className={cn("relative")}>
      {/* Box with outline — label will overlap this border */}
      <div className={cn(
        "relative rounded-md border border-gray-300 bg-background px-3 pt-4 pb-2 overflow-visible transition-all duration-150",
        "focus-within:border-black focus-within:border-2 focus-within:shadow-none",
      )}>
        {/* Decorative corner that appears on focus */}
        <div className={cn(
          "pointer-events-none absolute -left-3 -top-3 w-4 h-4 rounded-tl-md border-t-2 border-l-2 border-transparent",
          "focus-within:border-black"
        )} />
        <Input
          id={inputId}
          placeholder={placeholderValue}
          // make the native input visually transparent — wrapper provides the outline
          className={cn(
            "peer w-full bg-transparent border-0 p-0 m-0 text-base placeholder-transparent",
            "focus:ring-0 focus-visible:ring-0 focus:outline-none",
            trailing ? 'pr-10' : '',
            className
          )}
          style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}
          {...props}
        />

        {trailing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">{trailing}</div>
        )}
      </div>

      <label
        htmlFor={inputId}
        className={cn(
          "absolute left-3 -top-2 z-30 px-1 text-sm pointer-events-none bg-background transition-all duration-150",
          // muted by default
          "text-muted-foreground",
          // empty input: label sits inside the box
          "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:scale-100",
          // focused or has value: label moves above box and shrinks, and darkens
          "peer-focus:-top-2 peer-focus:text-xs peer-focus:scale-95 peer-focus:text-foreground",
          "peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:scale-95"
        )}
      >
        {label}
      </label>
    </div>
  )
}
