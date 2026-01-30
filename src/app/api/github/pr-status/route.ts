import { type NextRequest, NextResponse } from 'next/server'

interface PullRequest {
  state: 'open' | 'closed' | 'merged'
  draft: boolean
  mergeable?: boolean | null
  mergeable_state?: string
  number: number
  title: string
  head: {
    ref: string
  }
  base: {
    ref: string
  }
  merged_at: string | null
  created_at: string
  updated_at: string
}

interface CheckRun {
  conclusion: string | null
  status: string
  name: string
}

// Parse GitHub PR URL to extract owner, repo, and PR number
function parseGitHubUrl(url: string): { owner: string; repo: string; number: number } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/)
  if (!match) return null
  
  return {
    owner: match[1],
    repo: match[2],
    number: parseInt(match[3], 10)
  }
}

// GET /api/github/pr-status?url=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
  }
  
  const parsed = parseGitHubUrl(url)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid GitHub PR URL' }, { status: 400 })
  }
  
  const { owner, repo, number } = parsed
  
  // Use GitHub API token if available (from env or config)
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Jarvis-Tasks'
  }
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  
  try {
    // Fetch PR details
    const prResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
      { headers }
    )
    
    if (!prResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch PR', 
        details: await prResponse.text() 
      }, { status: prResponse.status })
    }
    
    const pr: PullRequest = await prResponse.json()
    
    // Determine PR status
    let status: string
    let statusIcon: string
    let statusColor: string
    
    if (pr.merged_at) {
      status = 'merged'
      statusIcon = '🟣'
      statusColor = '#8b5cf6'
    } else if (pr.state === 'closed') {
      status = 'closed'
      statusIcon = '🔴'
      statusColor = '#ef4444'
    } else if (pr.draft) {
      status = 'draft'
      statusIcon = '⚪'
      statusColor = '#6b7280'
    } else {
      status = 'open'
      statusIcon = '🟢'
      statusColor = '#10b981'
    }
    
    // Try to fetch checks status (CI)
    let checksStatus = 'unknown'
    let checksIcon = '⚪'
    
    try {
      const checksResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/checks`,
        { headers }
      )
      
      if (checksResponse.ok) {
        const checks = await checksResponse.json()
        if (checks.check_runs && checks.check_runs.length > 0) {
          const allSuccess = checks.check_runs.every((run: CheckRun) => 
            run.conclusion === 'success' || run.status === 'completed'
          )
          const anyFailure = checks.check_runs.some((run: CheckRun) => 
            run.conclusion === 'failure' || run.conclusion === 'error'
          )
          const anyPending = checks.check_runs.some((run: CheckRun) => 
            run.status === 'queued' || run.status === 'in_progress'
          )
          
          if (anyFailure) {
            checksStatus = 'failed'
            checksIcon = '❌'
          } else if (anyPending) {
            checksStatus = 'pending'
            checksIcon = '🟡'
          } else if (allSuccess) {
            checksStatus = 'passed'
            checksIcon = '✅'
          }
        }
      }
    } catch (error) {
      // Checks API might not be accessible, ignore
    }
    
    return NextResponse.json({
      number: pr.number,
      title: pr.title,
      status,
      statusIcon,
      statusColor,
      checksStatus,
      checksIcon,
      draft: pr.draft,
      branch: pr.head.ref,
      targetBranch: pr.base.ref,
      url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at
    })
  } catch (error) {
    console.error('Error fetching PR status:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch PR status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}