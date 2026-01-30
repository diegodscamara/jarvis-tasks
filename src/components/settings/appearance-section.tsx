'use client'

import { useTheme } from '@/components/theme-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ACCENT_COLORS,
  DEFAULT_VIEW_OPTIONS,
  FONT_SIZE_OPTIONS,
  THEME_OPTIONS,
  VIEW_DENSITY_OPTIONS,
} from '@/lib/settings'
import type { Settings } from '@/types'
import { SettingRow } from './setting-row'
import { SettingsSection } from './settings-section'

interface AppearanceSectionProps {
  settings: Settings
  onSettingsChange: (updates: Partial<Settings>) => void
}

export function AppearanceSection({ settings, onSettingsChange }: AppearanceSectionProps) {
  const { themeVariant, setTheme } = useTheme()

  const handleThemeChange = (value: string) => {
    onSettingsChange({ theme: value })
    setTheme(value as Parameters<typeof setTheme>[0])
  }

  const handleAccentChange = (value: string) => {
    onSettingsChange({ accentColor: value })
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--accent-color', value)
    }
  }

  return (
    <SettingsSection title="Appearance" description="Customize the look and feel of the app">
      <SettingRow label="Theme" description="Choose a color theme">
        <Select value={themeVariant} onValueChange={(v) => v != null && handleThemeChange(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {THEME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Accent color" description="Primary accent color">
        <div className="flex gap-2 flex-wrap">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleAccentChange(color.value)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                settings.accentColor === color.value
                  ? 'border-foreground scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
              aria-label={`Accent color ${color.name}`}
            />
          ))}
        </div>
      </SettingRow>

      <SettingRow label="View density" description="Compact, comfortable, or spacious">
        <Select
          value={settings.viewDensity ?? 'comfortable'}
          onValueChange={(v) => onSettingsChange({ viewDensity: v as Settings['viewDensity'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VIEW_DENSITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Font size" description="Base text size">
        <Select
          value={settings.fontSize ?? 'medium'}
          onValueChange={(v) => onSettingsChange({ fontSize: v as Settings['fontSize'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Default view" description="View shown when opening the app">
        <Select
          value={settings.defaultView ?? 'board'}
          onValueChange={(v) => onSettingsChange({ defaultView: v as Settings['defaultView'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_VIEW_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </SettingsSection>
  )
}
