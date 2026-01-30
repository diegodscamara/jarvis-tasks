import { NextResponse } from 'next/server'
import { openAPIDocument } from '@/lib/openapi'

export async function GET() {
  return NextResponse.json(openAPIDocument)
}