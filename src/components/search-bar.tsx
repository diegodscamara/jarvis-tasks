'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Search, X, Filter, Save, Clock, Star } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import type { SearchFilters, SavedSearch } from '@/lib/search'

interface SearchBarProps {
  onSearch: (query: string) => void
  onFiltersChange?: (filters: SearchFilters) => void
  className?: string
}

export function SearchBar({ onSearch, onFiltersChange, className }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const debouncedQuery = useDebounce(query, 300)
  
  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      fetch(`/api/search?suggestions=true&q=${encodeURIComponent(debouncedQuery)}`)
        .then(res => res.json())
        .then(data => setSuggestions(data.suggestions || []))
        .catch(console.error)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery])
  
  // Fetch saved searches
  useEffect(() => {
    fetch('/api/search?saved=true')
      .then(res => res.json())
      .then(data => setSavedSearches(data.savedSearches || []))
      .catch(console.error)
      
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recentSearches')
    if (stored) {
      setRecentSearches(JSON.parse(stored))
    }
  }, [])
  
  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    // Add to recent searches
    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 5)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
    
    onSearch(searchQuery)
    setIsOpen(false)
  }, [onSearch])
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query)
    }
  }
  
  const handleSaveSearch = async () => {
    if (!saveSearchName.trim() || !query.trim()) return
    
    try {
      await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveSearchName,
          query,
        }),
      })
      
      // Refresh saved searches
      const res = await fetch('/api/search?saved=true')
      const data = await res.json()
      setSavedSearches(data.savedSearches || [])
      
      setShowSaveDialog(false)
      setSaveSearchName('')
    } catch (error) {
      console.error('Failed to save search:', error)
    }
  }
  
  const handleUseSavedSearch = async (search: SavedSearch) => {
    // Update usage count
    await fetch('/api/search', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchId: search.id }),
    })
    
    // Build query string from saved search
    let queryString = search.query.text || ''
    
    // Add filters to query string
    const filters = search.query.filters
    if (filters.status) {
      filters.status.forEach(s => {
        queryString += ` status:${s}`
      })
    }
    if (filters.priority) {
      filters.priority.forEach(p => {
        queryString += ` priority:${p}`
      })
    }
    // Add other filters...
    
    setQuery(queryString.trim())
    handleSearch(queryString.trim())
  }
  
  const clearSearch = () => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }
  
  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder="Search tasks... (type 'status:' or 'priority:' for filters)"
              className="pl-9 pr-20"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-10 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={clearSearch}
              >
                <X size={14} />
              </Button>
            )}
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowSaveDialog(true)}
                disabled={!query}
                title="Save search"
              >
                <Save size={14} />
              </Button>
            </div>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-[600px] p-0" align="start">
          <Command>
            <CommandList>
              {suggestions.length > 0 && (
                <CommandGroup>
                  {suggestions.map((suggestion, idx) => (
                    <CommandItem
                      key={idx}
                      onSelect={() => {
                        setQuery(suggestion)
                        inputRef.current?.focus()
                      }}
                    >
                      <Search size={14} className="mr-2" />
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {savedSearches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    {savedSearches.map((search) => (
                      <CommandItem
                        key={search.id}
                        onSelect={() => handleUseSavedSearch(search)}
                      >
                        <Star size={14} className="mr-2" />
                        <span className="flex-1">{search.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Used {search.usageCount} times
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              
              {recentSearches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    {recentSearches.map((search, idx) => (
                      <CommandItem
                        key={idx}
                        onSelect={() => {
                          setQuery(search)
                          handleSearch(search)
                        }}
                      >
                        <Clock size={14} className="mr-2" />
                        {search}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              
              <CommandSeparator />
              <CommandGroup>
                <div className="px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <p>• Use quotes for exact matches: "bug fix"</p>
                  <p>• Filter by status: status:done</p>
                  <p>• Filter by priority: priority:high</p>
                  <p>• Filter by assignee: assignee:jarvis</p>
                  <p>• Filter by due date: due:tomorrow</p>
                  <p>• Combine filters: priority:high status:in_progress</p>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-96">
            <h3 className="font-semibold mb-4">Save Search</h3>
            <Input
              placeholder="Search name..."
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSearch()
              }}
              autoFocus
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSaveDialog(false)
                  setSaveSearchName('')
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}