'use client'

import { cn } from '@/lib/utils'

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <section className={cn('space-y-6', className)}>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}
