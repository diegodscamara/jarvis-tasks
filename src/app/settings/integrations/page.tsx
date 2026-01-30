'use client'

import { IntegrationsSection } from '@/components/settings'
import { useSettingsContext } from '@/contexts/settings-context'

export default function SettingsIntegrationsPage() {
  const { settings, updateSettings } = useSettingsContext()
  return <IntegrationsSection settings={settings} onSettingsChange={updateSettings} />
}
