'use client'

import { useEffect, useState } from 'react'
import { PreferencesSection } from '@/components/settings'
import { useSettingsContext } from '@/contexts/settings-context'

export default function SettingsPreferencesPage() {
  const { settings, updateSettings } = useSettingsContext()
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data: { projects?: { id: string; name: string }[] }) => {
        const list = data?.projects ?? data
        setProjects(Array.isArray(list) ? list : [])
      })
      .catch(() => setProjects([]))
  }, [])

  return (
    <PreferencesSection
      settings={settings}
      onSettingsChange={updateSettings}
      projectOptions={projects}
    />
  )
}
