'use client'

import * as React from 'react'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/lib/settings'
import type { Settings } from '@/types'

interface SettingsContextValue {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
}

const SettingsContext = React.createContext<SettingsContextValue | undefined>(undefined)

export function useSettingsContext() {
  const ctx = React.useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettingsContext must be used within SettingsProvider')
  }
  return ctx
}

interface SettingsProviderProps {
  children: React.ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = React.useState<Settings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setSettings(loadSettings())
    setMounted(true)
  }, [])

  const updateSettings = React.useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    saveSettings(settings)
  }, [settings, mounted])

  const value = React.useMemo<SettingsContextValue>(
    () => ({ settings, updateSettings }),
    [settings, updateSettings]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
