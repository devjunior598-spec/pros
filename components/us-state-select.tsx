"use client"

import { US_STATES } from "@/lib/us-region"

interface USStateSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
  required?: boolean
  disabled?: boolean
}

export function USStateSelect({ id, value, onChange, className, required, disabled }: USStateSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className || "h-10 w-full rounded-md border border-input bg-background px-3 text-sm"}
      required={required}
      disabled={disabled}
    >
      <option value="">Select a state</option>
      {US_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
    </select>
  )
}
