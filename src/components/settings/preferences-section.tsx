'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  AGENT_OPTIONS,
  AUTO_SAVE_INTERVAL_OPTIONS,
  DATE_FORMAT_OPTIONS,
  PRIORITY_OPTIONS,
  TIME_FORMAT_OPTIONS,
  WEEK_STARTS_OPTIONS,
} from '@/lib/settings'
import type { Settings } from '@/types'
import { SettingRow } from './setting-row'
import { SettingsSection } from './settings-section'

interface PreferencesSectionProps {
  settings: Settings
  onSettingsChange: (updates: Partial<Settings>) => void
  projectOptions: { id: string; name: string }[]
}

export function PreferencesSection({
  settings,
  onSettingsChange,
  projectOptions,
}: PreferencesSectionProps) {
  return (
    <SettingsSection title="Preferences" description="Default behavior and workflow options">
      <SettingRow label="Default assignee" description="Assignee for new tasks">
        <Select
          value={settings.defaultAssignee}
          onValueChange={(v) =>
            onSettingsChange({ defaultAssignee: v as Settings['defaultAssignee'] })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGENT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Default priority" description="Priority for new tasks">
        <Select
          value={settings.defaultPriority ?? 'medium'}
          onValueChange={(v) =>
            onSettingsChange({ defaultPriority: v as Settings['defaultPriority'] })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Default project" description="Project for new tasks">
        <Select
          value={settings.defaultProject ?? '__none__'}
          onValueChange={(v) =>
            onSettingsChange({
              defaultProject: v === '__none__' ? null : v,
            })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {projectOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Show completed tasks" description="Display done tasks on the board">
        <Switch
          checked={settings.showCompletedTasks}
          onCheckedChange={(v) => onSettingsChange({ showCompletedTasks: v })}
        />
      </SettingRow>

      <SettingRow label="Compact view" description="Smaller task cards">
        <Switch
          checked={settings.compactView}
          onCheckedChange={(v) => onSettingsChange({ compactView: v })}
        />
      </SettingRow>

      <SettingRow label="Auto-save" description="Save changes automatically">
        <Switch
          checked={settings.autoSave ?? true}
          onCheckedChange={(v) => onSettingsChange({ autoSave: v })}
        />
      </SettingRow>

      {settings.autoSave !== false && (
        <SettingRow label="Auto-save interval" description="How often to save">
          <Select
            value={String(settings.autoSaveInterval ?? 10)}
            onValueChange={(v) =>
              onSettingsChange({
                autoSaveInterval: Number(v) as Settings['autoSaveInterval'],
              })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTO_SAVE_INTERVAL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      )}

      <SettingRow label="Date format" description="How dates are displayed">
        <Select
          value={settings.dateFormat ?? 'relative'}
          onValueChange={(v) => onSettingsChange({ dateFormat: v as Settings['dateFormat'] })}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_FORMAT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Time format" description="12 or 24 hour">
        <Select
          value={settings.timeFormat ?? '12h'}
          onValueChange={(v) => onSettingsChange({ timeFormat: v as Settings['timeFormat'] })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_FORMAT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Week starts on" description="First day of the week">
        <Select
          value={String(settings.weekStartsOn ?? 1)}
          onValueChange={(v) =>
            onSettingsChange({
              weekStartsOn: Number(v) as Settings['weekStartsOn'],
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEK_STARTS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </SettingsSection>
  )
}
