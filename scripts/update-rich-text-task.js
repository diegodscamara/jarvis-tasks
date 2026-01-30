const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/jarvis.db');
const db = new Database(dbPath);

// Find the Rich Text Editor task
const task = db.prepare(`
  SELECT id, title, status 
  FROM tasks 
  WHERE title LIKE '%Rich Text%' 
     OR title LIKE '%rich text%'
     OR description LIKE '%roadmap-006%'
`).get();

if (task) {
  console.log('Found task:', task);
  
  // Update status to done
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('done', task.id);
  
  console.log('✅ Updated task status to done!');
} else {
  console.log('Rich Text Editor task not found');
}

db.close();