import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';
import { eq, like, or, sql } from 'drizzle-orm';

async function updateRichTextTaskStatus() {
  try {
    // Find the Rich Text Editor task
    const richTextTasks = await db
      .select()
      .from(tasks)
      .where(
        or(
          like(tasks.title, '%Rich Text%'),
          like(tasks.title, '%rich text%'),
          like(tasks.description, '%roadmap-006%')
        )
      )
      .limit(1);

    if (richTextTasks.length > 0) {
      const task = richTextTasks[0];
      console.log('Found task:', { id: task.id, title: task.title, currentStatus: task.status });

      // Update status to done
      await db
        .update(tasks)
        .set({ status: 'done' })
        .where(eq(tasks.id, task.id));

      console.log('✅ Successfully updated Rich Text Editor task status to done!');
    } else {
      console.log('❌ Rich Text Editor task not found');
    }
  } catch (error) {
    console.error('Error updating task status:', error);
  }
}

updateRichTextTaskStatus();