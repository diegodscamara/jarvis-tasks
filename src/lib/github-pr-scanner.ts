import { exec } from 'child_process'
import { promisify } from 'util'
import Database from 'better-sqlite3'
import path from 'path'

const execAsync = promisify(exec)

interface PR {
  number: number
  title: string
  url: string
  headRefName: string
  state: string
}

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'jarvis-tasks.db'))
}

// Extract task ID from branch name
function extractTaskIdFromBranch(branch: string): string | null {
  // Look for patterns like: roadmap-009, TASK-123, task-456
  const patterns = [
    /roadmap-(\d{3,4})/i,
    /task[-_]?(\d+)/i,
    /issue[-_]?(\d+)/i,
    /^(\d+)[-_]/,
  ]
  
  for (const pattern of patterns) {
    const match = branch.match(pattern)
    if (match) {
      const id = match[1]
      // Check if we need to prepend 'roadmap-' for roadmap tasks
      if (pattern === patterns[0]) {
        return `roadmap-${id}`
      }
      return id
    }
  }
  
  return null
}

export async function scanAndLinkPRs(repoSlug?: string) {
  const db = getDb()
  const results = {
    scanned: 0,
    linked: 0,
    errors: 0,
    details: [] as any[]
  }
  
  try {
    // Get list of repositories to scan
    let repos: string[] = []
    
    if (repoSlug) {
      repos = [repoSlug]
    } else {
      // Try to infer from existing GitHub links
      const existingLinks = db.prepare(
        "SELECT DISTINCT url FROM task_links WHERE type IN ('github', 'github-pr', 'github-issue')"
      ).all() as { url: string }[]
      
      const repoSet = new Set<string>()
      for (const link of existingLinks) {
        const match = link.url.match(/github\.com\/([^\/]+\/[^\/]+)/)
        if (match) {
          repoSet.add(match[1])
        }
      }
      
      repos = Array.from(repoSet)
      
      // If no repos found, try current directory
      if (repos.length === 0) {
        try {
          const { stdout: remote } = await execAsync('git remote get-url origin')
          const match = remote.match(/github\.com[:/]([^\/]+\/[^\/\.]+)/)
          if (match) {
            repos = [match[1]]
          }
        } catch {
          // Not a git repo or no origin, that's fine
        }
      }
    }
    
    if (repos.length === 0) {
      db.close()
      return {
        ...results,
        error: 'No repositories found to scan'
      }
    }
    
    // Scan each repository
    for (const repo of repos) {
      try {
        console.log(`Scanning repository: ${repo}`)
        
        // Get all open PRs
        const { stdout } = await execAsync(
          `gh pr list --repo ${repo} --state open --json number,title,url,headRefName,state --limit 100`
        )
        
        const prs: PR[] = JSON.parse(stdout)
        results.scanned += prs.length
        
        for (const pr of prs) {
          // Extract task ID from branch name
          const taskId = extractTaskIdFromBranch(pr.headRefName)
          
          if (taskId) {
            // Check if task exists
            const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId)
            
            if (task) {
              // Check if PR is already linked
              const existingLink = db.prepare(
                'SELECT id FROM task_links WHERE task_id = ? AND url = ?'
              ).get(taskId, pr.url)
              
              if (!existingLink) {
                // Add the link
                const linkId = `link-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
                const title = `PR #${pr.number}: ${pr.title}`
                
                // Get max position
                const maxPos = db.prepare(
                  'SELECT MAX(position) as max FROM task_links WHERE task_id = ?'
                ).get(taskId) as { max: number | null }
                const position = (maxPos?.max ?? -1) + 1
                
                db.prepare(`
                  INSERT INTO task_links (id, task_id, url, title, type, icon, position)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(linkId, taskId, pr.url, title, 'github-pr', '🔀', position)
                
                results.linked++
                results.details.push({
                  taskId,
                  prNumber: pr.number,
                  branch: pr.headRefName,
                  title: pr.title
                })
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning repo ${repo}:`, error)
        results.errors++
      }
    }
    
    db.close()
    return results
  } catch (error) {
    db.close()
    throw error
  }
}

// Scan for a specific task
export async function scanPRsForTask(taskId: string, repoSlug?: string) {
  const db = getDb()
  const results = {
    found: 0,
    linked: 0,
    prs: [] as any[]
  }
  
  try {
    // Determine repos to scan (similar logic as above)
    let repos: string[] = []
    
    if (repoSlug) {
      repos = [repoSlug]
    } else {
      // Try to infer from task's existing links
      const existingLinks = db.prepare(
        "SELECT DISTINCT url FROM task_links WHERE task_id = ? AND type IN ('github', 'github-pr', 'github-issue')"
      ).all(taskId) as { url: string }[]
      
      const repoSet = new Set<string>()
      for (const link of existingLinks) {
        const match = link.url.match(/github\.com\/([^\/]+\/[^\/]+)/)
        if (match) {
          repoSet.add(match[1])
        }
      }
      
      repos = Array.from(repoSet)
      
      // Default to current repo if none found
      if (repos.length === 0) {
        try {
          const { stdout: remote } = await execAsync('git remote get-url origin')
          const match = remote.match(/github\.com[:/]([^\/]+\/[^\/\.]+)/)
          if (match) {
            repos = [match[1]]
          }
        } catch {
          // Not a git repo, that's fine
        }
      }
    }
    
    // Search for PRs mentioning the task ID in branch name or title
    for (const repo of repos) {
      try {
        // Search in open PRs
        const { stdout: openPRs } = await execAsync(
          `gh pr list --repo ${repo} --state open --search "${taskId}" --json number,title,url,headRefName,state --limit 50`
        )
        
        // Also search in recently closed PRs
        const { stdout: closedPRs } = await execAsync(
          `gh pr list --repo ${repo} --state closed --search "${taskId}" --json number,title,url,headRefName,state --limit 20`
        )
        
        const allPRs = [...JSON.parse(openPRs), ...JSON.parse(closedPRs)]
        
        for (const pr of allPRs) {
          // Check if PR matches task (in branch or title)
          const branchTaskId = extractTaskIdFromBranch(pr.headRefName)
          const titleMatch = pr.title.toLowerCase().includes(taskId.toLowerCase())
          
          if (branchTaskId === taskId || titleMatch) {
            results.found++
            
            // Check if already linked
            const existingLink = db.prepare(
              'SELECT id FROM task_links WHERE task_id = ? AND url = ?'
            ).get(taskId, pr.url)
            
            if (!existingLink) {
              // Add the link
              const linkId = `link-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
              const title = `PR #${pr.number}: ${pr.title}`
              
              // Get max position
              const maxPos = db.prepare(
                'SELECT MAX(position) as max FROM task_links WHERE task_id = ?'
              ).get(taskId) as { max: number | null }
              const position = (maxPos?.max ?? -1) + 1
              
              db.prepare(`
                INSERT INTO task_links (id, task_id, url, title, type, icon, position)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `).run(linkId, taskId, pr.url, title, 'github-pr', '🔀', position)
              
              results.linked++
            }
            
            results.prs.push({
              number: pr.number,
              title: pr.title,
              url: pr.url,
              branch: pr.headRefName,
              state: pr.state,
              alreadyLinked: !!existingLink
            })
          }
        }
      } catch (error) {
        console.error(`Error searching in repo ${repo}:`, error)
      }
    }
    
    db.close()
    return results
  } catch (error) {
    db.close()
    throw error
  }
}