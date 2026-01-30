'use client'

import * as React from 'react'
import { getThemeByVariant, linearPurpleTheme, type Theme, type ThemeVariant } from '@/lib/theme'

interface ThemeProviderContextType {
  theme: Theme
  themeVariant: ThemeVariant
  setTheme: (variant: ThemeVariant) => void
}

const ThemeProviderContext = React.createContext<ThemeProviderContextType | undefined>(undefined)

export function useTheme() {
  const context = React.useContext(ThemeProviderContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeVariant
}

export function ThemeProvider({ children, defaultTheme = 'linear-purple' }: ThemeProviderProps) {
  const [themeVariant, setThemeVariant] = React.useState<ThemeVariant>(() => {
    // Try to get theme from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme-variant')
      if (
        stored &&
        ['default', 'dark', 'light', 'midnight', 'linear-purple', 'linear-blue'].includes(stored)
      ) {
        return stored as ThemeVariant
      }
    }
    return defaultTheme
  })

  const theme = React.useMemo(() => {
    return getThemeByVariant(themeVariant) || linearPurpleTheme
  }, [themeVariant])

  const setTheme = React.useCallback((variant: ThemeVariant) => {
    setThemeVariant(variant)
    // Store theme preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-variant', variant)
    }
  }, [])

  // Apply theme CSS variables to root
  React.useEffect(() => {
    const root = document.documentElement

    // Remove all theme classes
    root.classList.remove('default', 'dark', 'light', 'midnight', 'linear-purple', 'linear-blue')

    // Add current theme class
    root.classList.add(theme.cssClass)

    // Apply CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVarName, value)
    })
  }, [theme])

  return (
    <ThemeProviderContext.Provider value={{ theme, themeVariant, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
