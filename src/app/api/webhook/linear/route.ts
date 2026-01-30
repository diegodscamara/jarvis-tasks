import { NextRequest, NextResponse } from 'next/server'

// Linear webhook handler - forwards to Clawdbot
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Log for debugging
    console.log('Linear webhook received:', JSON.stringify(payload, null, 2))
    
    const { action, type, data } = payload
    
    // Format message based on event type
    let message = ''
    
    if (type === 'Comment' && action === 'create') {
      const { body, issue, user } = data
      message = `💬 New comment on ${issue?.identifier || 'issue'}:\n"${body?.substring(0, 200)}${body?.length > 200 ? '...' : ''}"\n- ${user?.name || 'Someone'}`
    } else if (type === 'Issue' && action === 'update') {
      const { identifier, title, state } = data
      message = `📋 Issue updated: ${identifier} "${title}"\nStatus: ${state?.name || 'unknown'}`
    } else if (type === 'Issue' && action === 'create') {
      const { identifier, title } = data
      message = `🆕 New issue: ${identifier} "${title}"`
    }
    
    // Forward to Clawdbot webhook if we have a message
    if (message) {
      const clawdbotUrl = process.env.CLAWDBOT_WEBHOOK_URL
      if (clawdbotUrl) {
        await fetch(clawdbotUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message, source: 'linear' })
        }).catch(console.error)
      }
      
      // Also store for polling
      // TODO: Store in database for heartbeat polling
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Linear webhook error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

// Verify webhook (Linear sends GET to verify)
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'linear-webhook' })
}
