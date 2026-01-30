const { getAllTasks, updateTask } = require('../src/db/queries');

// Find the Rich Text Editor task
const tasks = getAllTasks();
const richTextTask = tasks.find(task => 
  task.title.toLowerCase().includes('rich text') ||
  task.description.toLowerCase().includes('roadmap-006')
);

if (richTextTask) {
  console.log('Found task:', {
    id: richTextTask.id,
    title: richTextTask.title,
    currentStatus: richTextTask.status
  });

  // Update status to done
  const updatedTask = updateTask(richTextTask.id, { status: 'done' });
  
  if (updatedTask) {
    console.log('✅ Successfully updated Rich Text Editor task status to done!');
    console.log('Updated task:', {
      id: updatedTask.id,
      title: updatedTask.title,
      status: updatedTask.status
    });
  }
} else {
  console.log('❌ Rich Text Editor task not found');
  console.log('Available tasks:');
  tasks.forEach(task => {
    console.log(`- ${task.title} (${task.status})`);
  });
}