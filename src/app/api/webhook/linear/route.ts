import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8428574001'

async function sendTelegram(message: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('No Telegram token, skipping notification:', message)
    return
  }
  
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    })
  } catch (e) {
    console.error('Telegram send failed:', e)
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log('Linear webhook:', JSON.stringify(payload, null, 2))
    
    const { action, type, data } = payload
    let message = ''
    
    if (type === 'Comment' && action === 'create') {
      const { body, issue, user } = data || {}
      message = `💬 <b>Linear Comment</b>\n<b>${issue?.identifier || 'Issue'}</b>: ${issue?.title || ''}\n\n"${body?.substring(0, 500) || 'No body'}"\n\n— ${user?.name || 'Someone'}`
    } else if (type === 'Issue' && action === 'update') {
      const { identifier, title, state } = data || {}
      message = `📋 <b>Linear Update</b>\n<b>${identifier}</b>: ${title}\nStatus → ${state?.name || 'unknown'}`
    } else if (type === 'Issue' && action === 'create') {
      const { identifier, title, assignee } = data || {}
      message = `🆕 <b>New Linear Issue</b>\n<b>${identifier}</b>: ${title}${assignee ? `\nAssigned to: ${assignee.name}` : ''}`
    }
    
    if (message) {
      await sendTelegram(message)
    }
    
    return NextResponse.json({ success: true, notified: !!message })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'linear-webhook' })
}
