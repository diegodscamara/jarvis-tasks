'use client'

import { Bell, Database, Palette, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/settings', label: 'Appearance', icon: Palette },
  { href: '/settings/preferences', label: 'Preferences', icon: SlidersHorizontal },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/data', label: 'Data', icon: Database },
] as const

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/settings' ? pathname === '/settings' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
