'use client'

import { AppearanceSection } from '@/components/settings'
import { useSettingsContext } from '@/contexts/settings-context'

export default function SettingsAppearancePage() {
  const { settings, updateSettings } = useSettingsContext()
  return <AppearanceSection settings={settings} onSettingsChange={updateSettings} />
}
