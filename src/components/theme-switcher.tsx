'use client'

import { Check, Moon, Palette, Sun } from 'lucide-react'
import * as React from 'react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type ThemeVariant, themes } from '@/lib/theme'

const defaultThemes: { variant: ThemeVariant; name: string; icon: React.ReactNode }[] = [
  { variant: 'light', name: 'Light', icon: <Sun className="w-4 h-4" /> },
  { variant: 'dark', name: 'Dark', icon: <Moon className="w-4 h-4" /> },
]

export function ThemeSwitcher() {
  const { themeVariant, setTheme } = useTheme()

  const allThemes = React.useMemo(() => {
    return [
      ...defaultThemes,
      ...themes.map((theme) => ({
        variant: theme.variant,
        name: theme.name,
        icon: <Palette className="w-4 h-4" />,
      })),
    ]
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="space-y-1">
          <p className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Classic</p>
          {defaultThemes.map((theme) => (
            <DropdownMenuItem
              key={theme.variant}
              onClick={() => setTheme(theme.variant)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {theme.icon}
                <span>{theme.name}</span>
              </div>
              {themeVariant === theme.variant && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        <div className="space-y-1">
          <p className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Linear Themes</p>
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.variant}
              onClick={() => setTheme(theme.variant)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{
                    backgroundColor: `hsl(${theme.colors.primary})`,
                    borderColor: `hsl(${theme.colors.border})`,
                  }}
                />
                <span>{theme.name}</span>
              </div>
              {themeVariant === theme.variant && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
