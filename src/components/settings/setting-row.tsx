'use client'

import { cn } from '@/lib/utils'

interface SettingRowProps {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingRow({ label, description, children, className }: SettingRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <label className="text-sm font-medium">{label}</label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0 sm:ml-4">{children}</div>
    </div>
  )
}
