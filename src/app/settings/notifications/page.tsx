'use client'

import { NotificationsSection } from '@/components/settings'
import { useSettingsContext } from '@/contexts/settings-context'

export default function SettingsNotificationsPage() {
  const { settings, updateSettings } = useSettingsContext()
  return <NotificationsSection settings={settings} onSettingsChange={updateSettings} />
}
