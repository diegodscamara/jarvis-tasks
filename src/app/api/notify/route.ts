import { NextRequest, NextResponse } from "next/server"
import * as db from "@/db/queries"

// Notification templates
const templates = {
  taskDue: (task: any) => `⏰ **Task Due Soon**\n\n📋 ${task.title}\n📅 Due: ${new Date(task.due_date).toLocaleDateString()}\n🔗 [Open Task](http://localhost:3333/?task=${task.id})`,
  taskOverdue: (task: any) => `🚨 **Overdue Task**\n\n📋 ${task.title}\n📅 Was due: ${new Date(task.due_date).toLocaleDateString()}\n🔗 [Open Task](http://localhost:3333/?task=${task.id})`,
  dailySummary: (stats: any) => `📊 **Daily Summary**\n\n✅ Completed today: ${stats.completedToday}\n⏳ In progress: ${stats.inProgress}\n🚨 Overdue: ${stats.overdue}\n📅 Due this week: ${stats.dueThisWeek}`,
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "summary"
  
  try {
    const tasks = db.getAllTasks()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    if (type === "overdue") {
      const overdueTasks = tasks.filter(t => 
        t.status !== "done" && 
        t.due_date && 
        new Date(t.due_date) < today
      )
      return NextResponse.json({
        count: overdueTasks.length,
        tasks: overdueTasks.slice(0, 5).map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.due_date,
          message: templates.taskOverdue(t)
        }))
      })
    }
    
    if (type === "due-soon") {
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      const dueSoon = tasks.filter(t =>
        t.status !== "done" &&
        t.due_date &&
        new Date(t.due_date) >= today &&
        new Date(t.due_date) <= tomorrow
      )
      return NextResponse.json({
        count: dueSoon.length,
        tasks: dueSoon.map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.due_date,
          message: templates.taskDue(t)
        }))
      })
    }
    
    // Default: daily summary
    const completedToday = tasks.filter(t => 
      t.status === "done" && 
      t.updated_at && 
      new Date(t.updated_at) >= today
    ).length
    
    const inProgress = tasks.filter(t => 
      t.status === "in_progress"
    ).length
    
    const overdue = tasks.filter(t => 
      t.status !== "done" && 
      t.due_date && 
      new Date(t.due_date) < today
    ).length
    
    const dueThisWeek = tasks.filter(t =>
      t.status !== "done" &&
      t.due_date &&
      new Date(t.due_date) >= today &&
      new Date(t.due_date) <= weekEnd
    ).length
    
    const stats = { completedToday, inProgress, overdue, dueThisWeek }
    
    return NextResponse.json({
      stats,
      message: templates.dailySummary(stats)
    })
  } catch (error) {
    console.error("Notify error:", error)
    return NextResponse.json({ error: "Failed to generate notification" }, { status: 500 })
  }
}
