import { NextRequest, NextResponse } from "next/server"
import * as db from "@/db/queries"

// Simple NLP for task parsing
function parseTaskInput(input: string) {
  const result: any = {
    title: input,
    priority: "medium",
    projectId: null,
    dueDate: null,
  }
  
  // Priority detection
  if (/urgent|asap|critical|!{2,}/i.test(input)) {
    result.priority = "high"
    result.title = result.title.replace(/urgent|asap|critical|!{2,}/gi, "").trim()
  } else if (/low priority|whenever|someday/i.test(input)) {
    result.priority = "low"
    result.title = result.title.replace(/low priority|whenever|someday/gi, "").trim()
  }
  
  // Due date detection
  const today = new Date()
  if (/today/i.test(input)) {
    result.dueDate = today.toISOString().split("T")[0]
    result.title = result.title.replace(/today/gi, "").trim()
  } else if (/tomorrow/i.test(input)) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    result.dueDate = tomorrow.toISOString().split("T")[0]
    result.title = result.title.replace(/tomorrow/gi, "").trim()
  } else if (/next week/i.test(input)) {
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    result.dueDate = nextWeek.toISOString().split("T")[0]
    result.title = result.title.replace(/next week/gi, "").trim()
  }
  
  // Project detection (hashtags)
  const projectMatch = input.match(/#(\w+)/i)
  if (projectMatch) {
    const projectName = projectMatch[1].toLowerCase()
    const projects = db.getAllProjects()
    const matchedProject = projects.find(p => 
      p.name.toLowerCase().includes(projectName) || 
      p.id.toLowerCase().includes(projectName)
    )
    if (matchedProject) {
      result.projectId = matchedProject.id
    }
    result.title = result.title.replace(/#\w+/g, "").trim()
  }
  
  // Clean up extra spaces
  result.title = result.title.replace(/\s+/g, " ").trim()
  
  return result
}

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()
    
    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Input required" }, { status: 400 })
    }
    
    const parsed = parseTaskInput(input)
    
    const task = db.createTask({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: parsed.title,
      description: "",
      priority: parsed.priority,
      status: "backlog",
      assignee: "jarvis",
      projectId: parsed.projectId,
      dueDate: parsed.dueDate,
    })
    
    return NextResponse.json({
      task,
      parsed: {
        originalInput: input,
        detectedPriority: parsed.priority,
        detectedProject: parsed.projectId,
        detectedDueDate: parsed.dueDate,
      }
    })
  } catch (error) {
    console.error("Quick capture error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
