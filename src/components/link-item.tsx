"use client"

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LinkItemProps {
  link: {
    id: string
    url: string
    title: string | null
    type: string
    icon: string
  }
  onRemove: (id: string) => void
}

interface PRStatus {
  number: number
  title: string
  status: string
  statusIcon: string
  statusColor: string
  checksStatus: string
  checksIcon: string
  draft: boolean
  branch: string
  targetBranch: string
  createdAt: string
  updatedAt: string
  mergedAt: string | null
}

export function LinkItem({ link, onRemove }: LinkItemProps) {
  const [prStatus, setPrStatus] = useState<PRStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch PR status if it's a GitHub PR
  useEffect(() => {
    if (link.type === 'github-pr') {
      fetchPRStatus()
      
      // Set up auto-refresh every 60 seconds
      const interval = setInterval(fetchPRStatus, 60000)
      
      return () => clearInterval(interval)
    }
  }, [link.url, link.type])

  const fetchPRStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/github/pr-status?url=${encodeURIComponent(link.url)}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch PR status')
      }
      
      const status = await response.json()
      setPrStatus(status)
    } catch (err) {
      console.error('Error fetching PR status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  // Render PR-specific UI
  if (link.type === 'github-pr' && prStatus) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-muted/30 group">
        <span>{link.icon || '🔀'}</span>
        <div className="flex-1 min-w-0">
          <a 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate block"
          >
            #{prStatus.number}: {prStatus.title || link.title || 'GitHub PR'}
          </a>
          <div className="flex items-center gap-2 mt-0.5">
            <span 
              className={cn(
                "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                "font-medium"
              )}
              style={{
                backgroundColor: `${prStatus.statusColor}20`,
                color: prStatus.statusColor
              }}
            >
              <span className="text-[10px]">{prStatus.statusIcon}</span>
              {prStatus.status.toUpperCase()}
              {prStatus.draft && ' (DRAFT)'}
            </span>
            {prStatus.checksStatus !== 'unknown' && (
              <span 
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                  prStatus.checksStatus === 'passed' && "bg-green-500/10 text-green-600",
                  prStatus.checksStatus === 'failed' && "bg-red-500/10 text-red-600",
                  prStatus.checksStatus === 'pending' && "bg-yellow-500/10 text-yellow-600"
                )}
              >
                <span className="text-[10px]">{prStatus.checksIcon}</span>
                CI {prStatus.checksStatus}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {prStatus.branch} → {prStatus.targetBranch}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchPRStatus}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1"
          title="Refresh status"
        >
          🔄
        </button>
        <button
          type="button"
          onClick={() => onRemove(link.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 -m-1"
        >
          ×
        </button>
      </div>
    )
  }

  // Render regular link
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-muted/30 group">
      <span>{link.icon || '🔗'}</span>
      <a 
        href={link.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex-1 text-sm text-primary hover:underline truncate"
      >
        {link.title || link.url}
      </a>
      <span className="text-xs text-muted-foreground">{link.type}</span>
      {link.type === 'github-pr' && loading && (
        <span className="text-xs text-muted-foreground">Loading...</span>
      )}
      {link.type === 'github-pr' && error && (
        <span className="text-xs text-red-500" title={error}>⚠️</span>
      )}
      <button
        type="button"
        onClick={() => onRemove(link.id)}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 -m-1"
      >
        ×
      </button>
    </div>
  )
}