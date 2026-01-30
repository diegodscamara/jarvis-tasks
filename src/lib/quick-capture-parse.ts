import type { Priority } from '@/types'

export interface ParsedQuickCapture {
  title: string
  priority: Priority
  dueDate: string | null
}

const PRIORITY_HIGH_PATTERN = /\b(urgent|asap|critical|important|!!)\b/gi
const PRIORITY_LOW_PATTERN = /\b(low\s*priority|whenever|someday|!)\b/gi
const TODAY_PATTERN = /\btoday\b/gi
const TOMORROW_PATTERN = /\btomorrow\b/gi
const NEXT_WEEK_PATTERN = /\bnext\s+week\b/gi
const IN_DAYS_PATTERN = /\bin\s+(\d+)\s+days?\b/i
const NEXT_MONDAY_PATTERN = /\bnext\s+monday\b/gi
const MONTH_DAY_PATTERN =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
const ISO_DATE_PATTERN = /\b(\d{4})-(\d{2})-(\d{2})\b/
const SLASH_DATE_PATTERN = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/

const MONTH_NAMES: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function parseMonthDay(match: RegExpMatchArray, base: Date): string | null {
  const monthStr = match[1].toLowerCase().slice(0, 3)
  const month = MONTH_NAMES[monthStr] ?? MONTH_NAMES[monthStr + 'uary']
  if (month === undefined) return null
  const day = parseInt(match[2], 10)
  const year = base.getFullYear()
  const d = new Date(year, month, day)
  if (d.getTime() < base.getTime()) d.setFullYear(year + 1)
  return toISODate(d)
}

function parseSlashDate(match: RegExpMatchArray, base: Date): string | null {
  const a = parseInt(match[1], 10)
  const b = parseInt(match[2], 10)
  const c = match[3] ? parseInt(match[3], 10) : base.getFullYear()
  const year = c < 100 ? 2000 + c : c
  const month = a <= 12 ? a - 1 : b - 1
  const day = a <= 12 ? b : a
  const d = new Date(year, month, day)
  return toISODate(d)
}

export function parseQuickCaptureInput(input: string): ParsedQuickCapture {
  const base = new Date()
  let title = input.trim()
  let priority: Priority = 'medium'
  let dueDate: string | null = null

  if (PRIORITY_HIGH_PATTERN.test(title)) {
    priority = 'high'
    title = title.replace(PRIORITY_HIGH_PATTERN, '').trim()
  }
  if (PRIORITY_LOW_PATTERN.test(title)) {
    priority = 'low'
    title = title.replace(PRIORITY_LOW_PATTERN, '').trim()
  }

  if (/\btoday\b/i.test(title)) {
    dueDate = toISODate(base)
    title = title.replace(TODAY_PATTERN, '').trim()
  } else if (/\btomorrow\b/i.test(title)) {
    const d = new Date(base)
    d.setDate(d.getDate() + 1)
    dueDate = toISODate(d)
    title = title.replace(TOMORROW_PATTERN, '').trim()
  } else if (/\bnext\s+week\b/i.test(title)) {
    const d = new Date(base)
    d.setDate(d.getDate() + 7)
    dueDate = toISODate(d)
    title = title.replace(NEXT_WEEK_PATTERN, '').trim()
  } else if (IN_DAYS_PATTERN.test(title)) {
    const m = title.match(IN_DAYS_PATTERN)
    if (m) {
      const n = parseInt(m[1], 10)
      const d = new Date(base)
      d.setDate(d.getDate() + n)
      dueDate = toISODate(d)
      title = title.replace(IN_DAYS_PATTERN, '').trim()
    }
  } else if (/\bnext\s+monday\b/i.test(title)) {
    const d = new Date(base)
    const day = d.getDay()
    const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day
    d.setDate(d.getDate() + daysUntilMonday)
    dueDate = toISODate(d)
    title = title.replace(NEXT_MONDAY_PATTERN, '').trim()
  } else {
    const monthDayMatch = title.match(MONTH_DAY_PATTERN)
    if (monthDayMatch) {
      const parsed = parseMonthDay(monthDayMatch, base)
      if (parsed) {
        dueDate = parsed
        title = title.replace(MONTH_DAY_PATTERN, '').trim()
      }
    } else {
      const isoMatch = title.match(ISO_DATE_PATTERN)
      if (isoMatch) {
        dueDate = isoMatch[0]
        title = title.replace(ISO_DATE_PATTERN, '').trim()
      } else {
        const slashMatch = title.match(SLASH_DATE_PATTERN)
        if (slashMatch) {
          const parsed = parseSlashDate(slashMatch, base)
          if (parsed) {
            dueDate = parsed
            title = title.replace(SLASH_DATE_PATTERN, '').trim()
          }
        }
      }
    }
  }

  title = title.replace(/\s+/g, ' ').trim()
  return { title, priority, dueDate }
}
