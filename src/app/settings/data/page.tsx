'use client'

import { SettingsSection } from '@/components/settings'

export default function SettingsDataPage() {
  return (
    <SettingsSection title="Data" description="Export, import, and manage your task data">
      <p className="text-sm text-muted-foreground">Data management options will appear here.</p>
    </SettingsSection>
  )
}
