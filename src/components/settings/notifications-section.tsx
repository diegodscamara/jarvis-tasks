'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { Settings } from '@/types'
import { SettingRow } from './setting-row'
import { SettingsSection } from './settings-section'

interface NotificationsSectionProps {
  settings: Settings
  onSettingsChange: (updates: Partial<Settings>) => void
}

export function NotificationsSection({ settings, onSettingsChange }: NotificationsSectionProps) {
  const requestDesktopPermission = () => {
    if (typeof Notification !== 'undefined' && Notification.requestPermission) {
      Notification.requestPermission()
    }
  }

  return (
    <SettingsSection title="Notifications" description="Configure how and when you receive updates">
      <SettingRow
        label="Enable notifications"
        description="Master toggle for all notification types"
      >
        <Switch
          checked={settings.notificationsEnabled ?? true}
          onCheckedChange={(v) => onSettingsChange({ notificationsEnabled: v })}
        />
      </SettingRow>

      {settings.notificationsEnabled !== false && (
        <>
          <SettingRow label="Task assigned to you" description="When a task is assigned to you">
            <Switch
              checked={settings.taskAssigned ?? true}
              onCheckedChange={(v) => onSettingsChange({ taskAssigned: v })}
            />
          </SettingRow>

          <SettingRow label="Task due soon" description="Less than 24 hours until due">
            <Switch
              checked={settings.taskDueSoon ?? true}
              onCheckedChange={(v) => onSettingsChange({ taskDueSoon: v })}
            />
          </SettingRow>

          <SettingRow label="Task overdue" description="When a task is past due">
            <Switch
              checked={settings.taskOverdue ?? true}
              onCheckedChange={(v) => onSettingsChange({ taskOverdue: v })}
            />
          </SettingRow>

          <SettingRow label="Comment on your task" description="When someone comments">
            <Switch
              checked={settings.taskComment ?? true}
              onCheckedChange={(v) => onSettingsChange({ taskComment: v })}
            />
          </SettingRow>

          <SettingRow label="Task completed" description="When a task is marked done">
            <Switch
              checked={settings.taskCompleted ?? false}
              onCheckedChange={(v) => onSettingsChange({ taskCompleted: v })}
            />
          </SettingRow>

          <SettingRow label="Daily summary" description="Scheduled daily digest">
            <Switch
              checked={settings.dailySummary ?? false}
              onCheckedChange={(v) => onSettingsChange({ dailySummary: v })}
            />
          </SettingRow>

          {settings.dailySummary && (
            <SettingRow label="Daily summary time" description="Time (HH:mm)">
              <Input
                type="time"
                value={settings.dailySummaryTime ?? '09:00'}
                onChange={(e) => onSettingsChange({ dailySummaryTime: e.target.value })}
                className="w-[120px]"
              />
            </SettingRow>
          )}

          <SettingRow label="Sound effects" description="Play sounds for notifications">
            <Switch
              checked={settings.soundEffects ?? false}
              onCheckedChange={(v) => onSettingsChange({ soundEffects: v })}
            />
          </SettingRow>

          {settings.soundEffects && (
            <SettingRow label="Sound volume" description="Volume (0–100)">
              <div className="flex items-center gap-3 w-[200px]">
                <Slider
                  value={[settings.soundVolume ?? 50]}
                  onValueChange={(val) =>
                    onSettingsChange({
                      soundVolume: Array.isArray(val) ? (val[0] ?? 50) : val,
                    })
                  }
                  min={0}
                  max={100}
                  step={1}
                />
                <span className="text-xs text-muted-foreground w-8">
                  {settings.soundVolume ?? 50}%
                </span>
              </div>
            </SettingRow>
          )}

          <SettingRow
            label="Telegram notifications"
            description="Send notifications to a Telegram channel"
          >
            <Switch
              checked={settings.telegramEnabled ?? false}
              onCheckedChange={(v) => onSettingsChange({ telegramEnabled: v })}
            />
          </SettingRow>

          {settings.telegramEnabled && (
            <div className="space-y-2">
              <Label className="text-sm">Channel ID</Label>
              <Input
                type="text"
                placeholder="@channel or -100..."
                value={settings.telegramChannelId ?? ''}
                onChange={(e) => onSettingsChange({ telegramChannelId: e.target.value })}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Bot token is configured via environment variables
              </p>
            </div>
          )}

          <SettingRow label="Desktop notifications" description="Browser push notifications">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.desktopNotifications ?? false}
                onCheckedChange={(v) => onSettingsChange({ desktopNotifications: v })}
              />
              <Button type="button" variant="outline" size="sm" onClick={requestDesktopPermission}>
                Request permission
              </Button>
            </div>
          </SettingRow>
        </>
      )}

      <SettingRow
        label="Keyboard shortcuts"
        description="Enable keyboard shortcuts (?, /, c, j, k, etc.)"
      >
        <Switch
          checked={settings.keyboardShortcuts ?? true}
          onCheckedChange={(v) => onSettingsChange({ keyboardShortcuts: v })}
        />
      </SettingRow>
    </SettingsSection>
  )
}
