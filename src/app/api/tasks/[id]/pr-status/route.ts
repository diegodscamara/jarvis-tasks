import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { type NextRequest, NextResponse } from 'next/server'

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

// GET /api/tasks/[id]/pr-status - Get PR status for task links
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params

  try {
    // First, get all GitHub PR links for this task
    const linksResponse = await fetch(`${request.nextUrl.origin}/api/tasks/${taskId}/links`)

    if (!linksResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch task links' }, { status: 500 })
    }

    const { links } = await linksResponse.json()
    const prLinks = links.filter((link: any) => link.type === 'github-pr')

    if (prLinks.length === 0) {
      return NextResponse.json({ prs: [] })
    }

    // Get status for each PR using GitHub CLI
    const prStatuses = await Promise.all(
      prLinks.map(async (link: any) => {
        try {
          // Extract owner/repo/number from URL
          const match = link.url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
          if (!match) {
            throw new Error('Invalid GitHub PR URL')
          }

          const [, owner, repo, number] = match
          const repoSlug = `${owner}/${repo}`

          // Use GitHub CLI to get PR details
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

          return {
            linkId: link.id,
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
          }
        } catch (error) {
          console.error(`Error fetching PR status for ${link.url}:`, error)
          return {
            linkId: link.id,
            url: link.url,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    return NextResponse.json({ prs: prStatuses })
  } catch (error) {
    console.error('Error fetching PR statuses:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch PR statuses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
