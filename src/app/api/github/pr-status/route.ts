import { exec } from 'child_process'
import { type NextRequest, NextResponse } from 'next/server'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface PRData {
  number: number
  title: string
  state: string
  isDraft: boolean
  statusCheckRollup: string | null
  headRefName: string
  baseRefName: string
  url: string
  createdAt: string
  updatedAt: string
  mergedAt: string | null
}

// Parse GitHub PR URL to extract owner, repo, and PR number
function parseGitHubUrl(url: string): { owner: string; repo: string; number: number } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!match) return null

  return {
    owner: match[1],
    repo: match[2],
    number: parseInt(match[3], 10),
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
  const repoSlug = `${owner}/${repo}`

  try {
    // Use GitHub CLI to get PR details (more reliable and uses existing auth)
    const { stdout } = await execAsync(
      `gh pr view ${number} --repo ${repoSlug} --json number,title,state,isDraft,statusCheckRollup,headRefName,baseRefName,url,createdAt,updatedAt,mergedAt`
    )

    const prData: PRData = JSON.parse(stdout)

    // Determine status and styling
    let status: string
    let statusIcon: string
    let statusColor: string

    if (prData.mergedAt) {
      status = 'merged'
      statusIcon = '🟣'
      statusColor = '#8b5cf6'
    } else if (prData.state === 'CLOSED') {
      status = 'closed'
      statusIcon = '🔴'
      statusColor = '#ef4444'
    } else if (prData.isDraft) {
      status = 'draft'
      statusIcon = '⚪'
      statusColor = '#6b7280'
    } else {
      status = 'open'
      statusIcon = '🟢'
      statusColor = '#10b981'
    }

    // Determine checks status
    let checksStatus = 'unknown'
    let checksIcon = '⚪'

    if (prData.statusCheckRollup) {
      switch (prData.statusCheckRollup.toUpperCase()) {
        case 'SUCCESS':
          checksStatus = 'passed'
          checksIcon = '✅'
          break
        case 'FAILURE':
        case 'ERROR':
          checksStatus = 'failed'
          checksIcon = '❌'
          break
        case 'PENDING':
        case 'QUEUED':
        case 'IN_PROGRESS':
          checksStatus = 'pending'
          checksIcon = '🟡'
          break
      }
    }

    return NextResponse.json({
      number: prData.number,
      title: prData.title,
      status,
      statusIcon,
      statusColor,
      checksStatus,
      checksIcon,
      draft: prData.isDraft,
      branch: prData.headRefName,
      targetBranch: prData.baseRefName,
      url: prData.url,
      createdAt: prData.createdAt,
      updatedAt: prData.updatedAt,
      mergedAt: prData.mergedAt,
    })
  } catch (error) {
    console.error('Error fetching PR status:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch PR status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
