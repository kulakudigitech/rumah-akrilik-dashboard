// Buat utility class untuk mengelola status tugas secara global
export default class TaskStatusManager {
  static getTasksFromStore() {
    try {
      return JSON.parse(localStorage.getItem('allProductionTasks') || '{}');
    } catch (e) {
      console.error("Error parsing tasks from store:", e);
      return {};
    }
  }
  
  static saveTasksToStore(tasks) {
    localStorage.setItem('allProductionTasks', JSON.stringify(tasks));
  }
  
  // Tambahkan parameter untuk informasi tahapan
  static updateTaskStatus(taskId, status, username, stageName, orderNumber, orderId, productName, customerName) {
    try {
      const tasks = this.getTasksFromStore();
      
      tasks[taskId] = {
        ...tasks[taskId],
        status: status,
        assignedTo: username,
        lastUpdated: new Date().toISOString(),
        stageName: stageName || tasks[taskId]?.stageName,
        orderNumber: orderNumber || tasks[taskId]?.orderNumber,
        orderId: orderId || tasks[taskId]?.orderId,
        productName: productName || tasks[taskId]?.productName,
        customerName: customerName || tasks[taskId]?.customerName
      };
      
      this.saveTasksToStore(tasks);
      
      // Broadcast event untuk sinkronisasi antar tab
      window.dispatchEvent(new CustomEvent('task-status-changed', {
        detail: { taskId, status }
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  }
  
  // Tambahkan fungsi untuk menormalisasi ID order
  static normalizeOrderId(id) {
    // Hapus semua karakter non-numerik
    return id.toString().replace(/\D/g, '');
  }

  // Perbarui fungsi getTaskStatus untuk mencari dengan ID yang dinormalisasi
  static getTaskStatus(taskId) {
    const tasks = this.getTasksFromStore();
    const normalizedTaskId = this.normalizeOrderId(taskId);
    
    // Cari dengan ID yang sama persis
    if (tasks[taskId]) {
      return tasks[taskId];
    }
    
    // Atau cari dengan ID yang dinormalisasi
    const matchingTaskId = Object.keys(tasks).find(id => 
      this.normalizeOrderId(id) === normalizedTaskId
    );
    
    return matchingTaskId ? tasks[matchingTaskId] : null;
  }
  
  static claimTask(taskId, username) {
    this.updateTaskStatus(taskId, 'in_progress', username);
  }
  
  static completeTask(taskId, username) {
    this.updateTaskStatus(taskId, 'completed', username);
  }
  
  static resetTaskStatus(taskId) {
    this.updateTaskStatus(taskId, 'pending', null);
  }

  // Tambahkan fungsi terkait progress
  static updateTaskProgress(taskId, stageName, progress, username) {
    try {
      const tasks = this.getTasksFromStore();
      const normalizedStageName = stageName.toLowerCase().replace(/\s+/g, '_');
      
      // Get or initialize task
      if (!tasks[taskId]) {
        tasks[taskId] = {
          status: 'pending',
          lastUpdated: new Date().toISOString(),
          assignedTo: username
        };
      }
      
      // Update task with progress info
      tasks[taskId] = {
        ...tasks[taskId],
        progress: {
          ...tasks[taskId].progress,
          [normalizedStageName]: progress
        },
        status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending',
        assignedTo: username,
        lastUpdated: new Date().toISOString(),
        stageName: stageName || tasks[taskId]?.stageName
      };
      
      this.saveTasksToStore(tasks);
      
      // Broadcast event untuk sinkronisasi antar tab
      window.dispatchEvent(new CustomEvent('task-progress-changed', {
        detail: { taskId, stageName: normalizedStageName, progress }
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating task progress:', error);
      return false;
    }
  }

  // Get progress for a task and stage
  static getTaskProgress(taskId, stageName) {
    const tasks = this.getTasksFromStore();
    const normalizedTaskId = this.normalizeOrderId(taskId);
    const normalizedStageName = stageName.toLowerCase().replace(/\s+/g, '_');
    
    // Try to find the task
    let task = tasks[taskId];
    
    // If not found by exact ID, try normalized ID
    if (!task) {
      const matchingTaskId = Object.keys(tasks).find(id => 
        this.normalizeOrderId(id) === normalizedTaskId
      );
      task = matchingTaskId ? tasks[matchingTaskId] : null;
    }
    
    // If task found and has progress data
    if (task && task.progress && typeof task.progress[normalizedStageName] === 'number') {
      return task.progress[normalizedStageName];
    }
    
    // Default based on status
    if (task && task.status) {
      return task.status === 'completed' ? 100 : 
             task.status === 'in_progress' ? 50 : 0;
    }
    
    return 0;
  }
}