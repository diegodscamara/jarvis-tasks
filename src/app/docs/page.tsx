'use client'

import { Book, FileText, FolderOpen, Plus, Search, Settings, Shield, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Document {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  source: string
  visibility: string
  created_at: string
  updated_at: string
  created_by: string
  memory_path?: string
  version: number
}

const CATEGORIES = [
  { value: 'all', label: 'All Documents', icon: FolderOpen },
  { value: 'guidelines', label: 'Guidelines', icon: Book },
  { value: 'reports', label: 'Reports', icon: FileText },
  { value: 'daily_logs', label: 'Daily Logs', icon: Zap },
  { value: 'agent_docs', label: 'Agent Docs', icon: Settings },
  { value: 'system', label: 'System', icon: Shield },
]

const CATEGORY_COLORS: Record<string, string> = {
  guidelines: 'bg-blue-500/10 text-blue-500',
  reports: 'bg-green-500/10 text-green-500',
  daily_logs: 'bg-yellow-500/10 text-yellow-500',
  agent_docs: 'bg-purple-500/10 text-purple-500',
  system: 'bg-gray-500/10 text-gray-400',
}

export default function DocsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      if (search) params.set('search', search)

      const res = await fetch(`/api/docs?${params}`)
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border p-4 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Docs</h1>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search docs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    category === cat.value
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Document List */}
        <div className="w-80 border-r border-border">
          <div className="p-4 border-b border-border">
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[calc(100vh-73px)]">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents found</p>
                <p className="text-sm mt-1">Create a new document to get started</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-accent/50',
                      selectedDoc?.id === doc.id && 'bg-accent'
                    )}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-medium truncate">{doc.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {formatDate(doc.updated_at)} · v{doc.version}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', CATEGORY_COLORS[doc.category])}
                      >
                        {doc.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 p-6">
          {selectedDoc ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedDoc.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last updated {formatDate(selectedDoc.updated_at)} by {selectedDoc.created_by}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{selectedDoc.category}</Badge>
                  <Badge variant="outline">v{selectedDoc.version}</Badge>
                </div>
              </div>

              {selectedDoc.tags?.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {selectedDoc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{selectedDoc.content}</pre>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Book className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a document to view</p>
                <p className="text-sm mt-1">Or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
