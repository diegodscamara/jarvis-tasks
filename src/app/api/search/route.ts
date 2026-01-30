import { type NextRequest, NextResponse } from 'next/server'
import * as db from '@/db/queries'
import { parseSearchQuery, filterTasks, rankSearchResults } from '@/lib/search'
import type { SavedSearch } from '@/lib/search'

// In-memory storage for saved searches (should be in DB in production)
const savedSearches: SavedSearch[] = []

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const getSuggestions = searchParams.get('suggestions') === 'true'
  const getSaved = searchParams.get('saved') === 'true'
  
  try {
    // Return saved searches if requested
    if (getSaved) {
      return NextResponse.json({
        savedSearches: savedSearches.sort((a, b) => b.usageCount - a.usageCount),
      })
    }
    
    // Get all data
    const tasks = db.getAllTasks()
    const projects = db.getAllProjects()
    const labels = db.getAllLabels()
    
    // Parse the search query
    const searchQuery = parseSearchQuery(query)
    
    // Return suggestions if requested
    if (getSuggestions) {
      const { getSearchSuggestions } = await import('@/lib/search')
      const suggestions = getSearchSuggestions(query, tasks as any, projects, labels)
      return NextResponse.json({ suggestions })
    }
    
    // Filter tasks based on search
    const filteredTasks = filterTasks(tasks as any, {
      ...searchQuery.filters,
      query: searchQuery.text,
    })
    
    // Rank results by relevance
    const rankedTasks = rankSearchResults(filteredTasks, searchQuery.text)
    
    // Format response
    const formattedTasks = rankedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      projectId: task.projectId,
      parentId: task.parentId,
      recurrenceType: task.recurrenceType,
      timeSpent: task.timeSpent,
      labelIds: task.labelIds,
      dueDate: task.dueDate,
      estimate: task.estimate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      comments: task.comments?.map((c) => ({
        id: c.id,
        author: c.author,
        content: c.content,
        createdAt: c.createdAt,
      })),
    }))
    
    return NextResponse.json({
      query,
      parsedQuery: searchQuery,
      totalResults: formattedTasks.length,
      tasks: formattedTasks,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}

// Save a search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, query } = body
    
    if (!name || !query) {
      return NextResponse.json(
        { error: 'Name and query are required' },
        { status: 400 }
      )
    }
    
    const parsedQuery = parseSearchQuery(query)
    
    const savedSearch: SavedSearch = {
      id: `search-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      query: {
        text: parsedQuery.text,
        filters: parsedQuery.filters,
      },
      createdAt: new Date().toISOString(),
      usageCount: 0,
    }
    
    savedSearches.push(savedSearch)
    
    return NextResponse.json({
      savedSearch,
      message: 'Search saved successfully',
    })
  } catch (error) {
    console.error('Error saving search:', error)
    return NextResponse.json(
      { error: 'Failed to save search' },
      { status: 500 }
    )
  }
}

// Update saved search usage count
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchId } = body
    
    if (!searchId) {
      return NextResponse.json(
        { error: 'searchId is required' },
        { status: 400 }
      )
    }
    
    const search = savedSearches.find(s => s.id === searchId)
    if (!search) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }
    
    search.usageCount++
    
    return NextResponse.json({
      savedSearch: search,
      message: 'Usage count updated',
    })
  } catch (error) {
    console.error('Error updating search:', error)
    return NextResponse.json(
      { error: 'Failed to update search' },
      { status: 500 }
    )
  }
}

// Delete a saved search
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const searchId = searchParams.get('id')
  
  if (!searchId) {
    return NextResponse.json(
      { error: 'Search ID is required' },
      { status: 400 }
    )
  }
  
  const index = savedSearches.findIndex(s => s.id === searchId)
  if (index === -1) {
    return NextResponse.json(
      { error: 'Saved search not found' },
      { status: 404 }
    )
  }
  
  savedSearches.splice(index, 1)
  
  return NextResponse.json({
    message: 'Search deleted successfully',
  })
}