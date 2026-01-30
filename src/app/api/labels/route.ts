import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/db/queries'

export async function GET() {
  try {
    const labels = await db.getAllLabels()
    return NextResponse.json({ labels })
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = body.id || `label-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const label = await db.createLabel({
      id,
      name: body.name,
      color: body.color || '#000000',
      group: body.group,
    })

    return NextResponse.json(label)
  } catch (error) {
    console.error('Error creating label:', error)
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Label ID required' }, { status: 400 })
    }

    const label = await db.updateLabel(id, updates)

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    return NextResponse.json(label)
  } catch (error) {
    console.error('Error updating label:', error)
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Label ID required' }, { status: 400 })
    }

    const deleted = await db.deleteLabel(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting label:', error)
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 })
  }
}