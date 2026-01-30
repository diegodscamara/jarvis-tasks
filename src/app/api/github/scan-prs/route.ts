import { type NextRequest, NextResponse } from 'next/server'
import { scanAndLinkPRs, scanPRsForTask } from '@/lib/github-pr-scanner'

// POST /api/github/scan-prs - Scan for PRs and auto-link them
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, repo } = body
    
    if (taskId) {
      // Scan for specific task
      const results = await scanPRsForTask(taskId, repo)
      return NextResponse.json({
        message: `Found ${results.found} PRs for task ${taskId}, linked ${results.linked} new PRs`,
        ...results
      })
    } else {
      // Scan all repositories
      const results = await scanAndLinkPRs(repo)
      return NextResponse.json({
        message: `Scanned ${results.scanned} PRs, linked ${results.linked} to tasks`,
        ...results
      })
    }
  } catch (error) {
    console.error('Error scanning PRs:', error)
    return NextResponse.json({ 
      error: 'Failed to scan PRs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}