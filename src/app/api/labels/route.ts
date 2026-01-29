import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'labels.json')

export interface Label {
  id: string
  name: string
  color: string
  group?: string
}

function loadLabels(): Label[] {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(data).labels || []
    }
  } catch (e) {
    console.error('Failed to load labels', e)
  }
  return []
}

function saveLabels(labels: Label[]) {
  writeFileSync(DATA_FILE, JSON.stringify({ labels }, null, 2))
}

export async function GET() {
  const labels = loadLabels()
  return NextResponse.json({ labels })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const labels = loadLabels()
  
  const newLabel: Label = {
    id: `label-${Date.now()}`,
    name: body.name,
    color: body.color || '#5E6AD2',
    group: body.group,
  }
  
  labels.push(newLabel)
  saveLabels(labels)
  
  return NextResponse.json({ label: newLabel })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const labels = loadLabels()
  
  const index = labels.findIndex(l => l.id === body.id)
  if (index === -1) {
    return NextResponse.json({ error: 'Label not found' }, { status: 404 })
  }
  
  labels[index] = { ...labels[index], ...body }
  saveLabels(labels)
  
  return NextResponse.json({ label: labels[index] })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  let labels = loadLabels()
  
  labels = labels.filter(l => l.id !== body.id)
  saveLabels(labels)
  
  return NextResponse.json({ success: true })
}
