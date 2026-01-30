import * as fs from 'node:fs'
import * as path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json')

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentColor: '#5E6AD2',
  fontSize: 'medium',
  compactMode: false,
  showCompletedTasks: true,
  defaultView: 'board',
  notificationsEnabled: true,
  soundEffects: false,
  keyboardShortcuts: true,
  autoSave: true,
  dateFormat: 'relative',
  weekStartsOn: 1, // Monday
  defaultProject: null,
  defaultPriority: 'medium',
}

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('Error reading settings:', error)
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: any) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

export async function GET() {
  return NextResponse.json(getSettings())
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json()
    const current = getSettings()
    const merged = { ...current, ...updates }
    saveSettings(merged)
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const newSettings = await request.json()
    const merged = { ...DEFAULT_SETTINGS, ...newSettings }
    saveSettings(merged)
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Settings replace error:', error)
    return NextResponse.json({ error: 'Failed to replace settings' }, { status: 500 })
  }
}
