'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SettingsSidebar } from '@/components/settings'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SettingsProvider } from '@/contexts/settings-context'
import { cn } from '@/lib/utils'

const MOBILE_NAV_ITEMS = [
  { href: '/settings', label: 'Appearance' },
  { href: '/settings/preferences', label: 'Preferences' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/data', label: 'Data' },
] as const

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const currentLabel =
    MOBILE_NAV_ITEMS.find((item) =>
      item.href === '/settings'
        ? (pathname || '') === '/settings'
        : (pathname || '').startsWith(item.href)
    )?.label ?? 'Appearance'

  return (
    <SettingsProvider>
      <div className="flex h-screen flex-col bg-background">
        <header className="flex shrink-0 items-center gap-4 border-b border-border px-4 py-3">
          <Link
            href="/"
            aria-label="Back to board"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </header>
        <div className="flex md:hidden border-b border-border px-4 py-2">
          <Select
            value={
              MOBILE_NAV_ITEMS.find((item) =>
                item.href === '/settings'
                  ? (pathname || '') === '/settings'
                  : (pathname || '').startsWith(item.href)
              )?.href ?? '/settings'
            }
            onValueChange={(v) => v && router.push(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{currentLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MOBILE_NAV_ITEMS.map((item) => (
                <SelectItem key={item.href} value={item.href}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-56 shrink-0 border-r border-border p-4 md:block">
            <SettingsSidebar />
          </aside>
          <Separator orientation="vertical" className="hidden md:block" />
          <main className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-6 max-w-2xl">{children}</div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </SettingsProvider>
  )
}
