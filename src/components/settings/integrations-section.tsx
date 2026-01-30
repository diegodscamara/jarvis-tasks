'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Settings } from '@/types'
import { SettingRow } from './setting-row'
import { SettingsSection } from './settings-section'

interface IntegrationsSectionProps {
  settings: Settings
  onSettingsChange: (updates: Partial<Settings>) => void
}

export function IntegrationsSection({ settings, onSettingsChange }: IntegrationsSectionProps) {
  return (
    <SettingsSection title="Integrations" description="Connect external tools and services">
      <SettingRow label="GitHub sync" description="Sync issues and PRs with a GitHub repository">
        <Switch
          checked={settings.githubEnabled ?? false}
          onCheckedChange={(v) => onSettingsChange({ githubEnabled: v })}
        />
      </SettingRow>

      {settings.githubEnabled && (
        <div className="space-y-2">
          <Label className="text-sm">Repository</Label>
          <Input
            type="text"
            placeholder="owner/repo"
            value={settings.githubRepository ?? ''}
            onChange={(e) => onSettingsChange({ githubRepository: e.target.value })}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Access token is configured via environment variables
          </p>
        </div>
      )}

      <SettingRow label="Incoming webhooks" description="Receive events from external services">
        <Switch
          checked={settings.webhooksEnabled ?? false}
          onCheckedChange={(v) => onSettingsChange({ webhooksEnabled: v })}
        />
      </SettingRow>

      {settings.webhooksEnabled && (
        <p className="text-xs text-muted-foreground">
          Webhook URL and secret are generated server-side. Configure in API or environment.
        </p>
      )}
    </SettingsSection>
  )
}
