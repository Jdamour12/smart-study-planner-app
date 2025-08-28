// Global state
let tasks = []
let notes = []
let currentTaskId = null
let editingTaskId = null
const editingNoteId = null

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  loadData()
  setupEventListeners()
  renderTasks()
  updateStats()
})

// Event listeners
function setupEventListeners() {
  // Search and filters
  document.getElementById("searchInput").addEventListener("input", renderTasks)
  document.getElementById("statusFilter").addEventListener("change", renderTasks)
  document.getElementById("priorityFilter").addEventListener("change", renderTasks)

  // Forms
  document.getElementById("taskForm").addEventListener("submit", handleTaskSubmit)
  document.getElementById("noteForm").addEventListener("submit", handleNoteSubmit)

  // Import file
  document.getElementById("importFile").addEventListener("change", handleFileSelect)

  // Close dialogs on overlay click
  document.querySelectorAll(".dialog-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.style.display = "none"
      }
    })
  })
}

// Data management
function loadData() {
  const savedTasks = localStorage.getItem("studyPlannerTasks")
  const savedNotes = localStorage.getItem("studyPlannerNotes")

  tasks = savedTasks ? JSON.parse(savedTasks) : []
  notes = savedNotes ? JSON.parse(savedNotes) : []
}

function saveData() {
  localStorage.setItem("studyPlannerTasks", JSON.stringify(tasks))
  localStorage.setItem("studyPlannerNotes", JSON.stringify(notes))
}

// Task management
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function createTask(taskData) {
  const task = {
    id: generateId(),
    title: taskData.title,
    description: taskData.description || "",
    subject: taskData.subject || "",
    priority: taskData.priority || "medium",
    status: taskData.status || "todo",
    dueDate: taskData.dueDate || null,
    tags: taskData.tags
      ? taskData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  tasks.push(task)
  saveData()
  return task
}

function updateTask(id, taskData) {
  const taskIndex = tasks.findIndex((task) => task.id === id)
  if (taskIndex !== -1) {
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...taskData,
      updatedAt: new Date().toISOString(),
    }
    saveData()
    return tasks[taskIndex]
  }
  return null
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id)
  notes = notes.filter((note) => note.taskId !== id)
  saveData()
}

function getTask(id) {
  return tasks.find((task) => task.id === id)
}

// Note management
function createNote(noteData) {
  const note = {
    id: generateId(),
    taskId: noteData.taskId,
    title: noteData.title,
    content: noteData.content,
    tags: noteData.tags
      ? noteData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  notes.push(note)
  saveData()
  return note
}

function deleteNote(id) {
  notes = notes.filter((note) => note.id !== id)
  saveData()
}

function getTaskNotes(taskId) {
  return notes.filter((note) => note.taskId === taskId)
}

// UI functions
function toggleTaskDialog(taskId = null) {
  const dialog = document.getElementById("taskDialog")
  const title = document.getElementById("taskDialogTitle")
  const form = document.getElementById("taskForm")

  if (dialog.style.display === "none" || !dialog.style.display) {
    editingTaskId = taskId

    if (taskId) {
      const task = getTask(taskId)
      if (task) {
        title.textContent = "Edit Task"
        document.getElementById("taskTitle").value = task.title
        document.getElementById("taskDescription").value = task.description
        document.getElementById("taskSubject").value = task.subject
        document.getElementById("taskPriority").value = task.priority
        document.getElementById("taskStatus").value = task.status
        document.getElementById("taskDueDate").value = task.dueDate || ""
        document.getElementById("taskTags").value = task.tags.join(", ")
      }
    } else {
      title.textContent = "Add New Task"
      form.reset()
    }

    dialog.style.display = "flex"
  } else {
    dialog.style.display = "none"
    editingTaskId = null
    form.reset()
  }
}

function toggleNotesDialog(taskId = null) {
  const dialog = document.getElementById("notesDialog")
  const title = document.getElementById("notesDialogTitle")

  if (dialog.style.display === "none" || !dialog.style.display) {
    currentTaskId = taskId
    const task = getTask(taskId)
    title.textContent = `Notes for: ${task ? task.title : "Task"}`

    document.getElementById("noteForm").reset()
    renderNotes()
    dialog.style.display = "flex"
  } else {
    dialog.style.display = "none"
    currentTaskId = null
  }
}

function toggleDataDialog() {
  const dialog = document.getElementById("dataDialog")
  dialog.style.display = dialog.style.display === "none" || !dialog.style.display ? "flex" : "none"
}

function handleTaskSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const taskData = {
    title: document.getElementById("taskTitle").value,
    description: document.getElementById("taskDescription").value,
    subject: document.getElementById("taskSubject").value,
    priority: document.getElementById("taskPriority").value,
    status: document.getElementById("taskStatus").value,
    dueDate: document.getElementById("taskDueDate").value,
    tags: document.getElementById("taskTags").value,
  }

  if (editingTaskId) {
    updateTask(editingTaskId, taskData)
  } else {
    createTask(taskData)
  }

  toggleTaskDialog()
  renderTasks()
  updateStats()
}

function handleNoteSubmit(e) {
  e.preventDefault()

  const noteData = {
    taskId: currentTaskId,
    title: document.getElementById("noteTitle").value,
    content: document.getElementById("noteContent").value,
    tags: document.getElementById("noteTags").value,
  }

  createNote(noteData)
  document.getElementById("noteForm").reset()
  renderNotes()
  renderTasks() // Update note count in task cards
}

function handleDeleteTask(taskId) {
  if (confirm("Are you sure you want to delete this task and all its notes?")) {
    deleteTask(taskId)
    renderTasks()
    updateStats()
  }
}

function handleDeleteNote(noteId) {
  if (confirm("Are you sure you want to delete this note?")) {
    deleteNote(noteId)
    renderNotes()
    renderTasks()
  }
}

function handleStatusChange(taskId, newStatus) {
  updateTask(taskId, { status: newStatus })
  renderTasks()
  updateStats()
}

// Rendering functions
function renderTasks() {
  const tasksList = document.getElementById("tasksList")
  const emptyState = document.getElementById("emptyState")
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()
  const statusFilter = document.getElementById("statusFilter").value
  const priorityFilter = document.getElementById("priorityFilter").value

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchTerm ||
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm) ||
      task.subject.toLowerCase().includes(searchTerm) ||
      task.tags.some((tag) => tag.toLowerCase().includes(searchTerm))

    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  if (filteredTasks.length === 0) {
    tasksList.style.display = "none"
    emptyState.style.display = "block"
    return
  }

  tasksList.style.display = "block"
  emptyState.style.display = "none"

  // Sort tasks by due date and priority
  filteredTasks.sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate)
    }
    if (a.dueDate) return -1
    if (b.dueDate) return 1

    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  tasksList.innerHTML = filteredTasks
    .map((task) => {
      const taskNotes = getTaskNotes(task.id)
      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

      return `
            <div class="task-card">
                <div class="task-header">
                    <div>
                        <h3 class="task-title">${escapeHtml(task.title)}</h3>
                        ${task.subject ? `<div class="task-subject">${escapeHtml(task.subject)}</div>` : ""}
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-small btn-secondary" onclick="toggleTaskDialog('${task.id}')">Edit</button>
                        <button class="btn btn-small btn-secondary" onclick="toggleNotesDialog('${task.id}')">Notes</button>
                        <button class="btn btn-small btn-danger" onclick="handleDeleteTask('${task.id}')">Delete</button>
                    </div>
                </div>
                
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ""}
                
                <div class="task-meta">
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    <span class="task-status status-${task.status}">${task.status.replace("-", " ")}</span>
                    ${task.dueDate ? `<span class="task-due-date ${isOverdue ? "overdue" : ""}">Due: ${formatDate(task.dueDate)}</span>` : ""}
                </div>
                
                ${
                  task.tags.length > 0
                    ? `
                    <div class="task-tags">
                        ${task.tags.map((tag) => `<span class="task-tag">${escapeHtml(tag)}</span>`).join("")}
                    </div>
                `
                    : ""
                }
                
                <div class="task-footer">
                    <div class="task-notes-count">${taskNotes.length} note${taskNotes.length !== 1 ? "s" : ""}</div>
                    <select onchange="handleStatusChange('${task.id}', this.value)" class="filter-select">
                        <option value="todo" ${task.status === "todo" ? "selected" : ""}>To Do</option>
                        <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
                        <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
                    </select>
                </div>
            </div>
        `
    })
    .join("")
}

function renderNotes() {
  const notesList = document.getElementById("notesList")
  const taskNotes = getTaskNotes(currentTaskId)

  if (taskNotes.length === 0) {
    notesList.innerHTML = '<div class="empty-state"><p>No notes yet. Add your first note above!</p></div>'
    return
  }

  notesList.innerHTML = taskNotes
    .map(
      (note) => `
        <div class="note-card">
            <div class="note-header">
                <h4 class="note-title">${escapeHtml(note.title)}</h4>
                <div>
                    <span class="note-date">${formatDate(note.createdAt.split("T")[0])}</span>
                    <button class="btn btn-small btn-danger" onclick="handleDeleteNote('${note.id}')" style="margin-left: 0.5rem;">Delete</button>
                </div>
            </div>
            <div class="note-content">${escapeHtml(note.content)}</div>
            ${
              note.tags.length > 0
                ? `
                <div class="note-tags">
                    ${note.tags.map((tag) => `<span class="note-tag">${escapeHtml(tag)}</span>`).join("")}
                </div>
            `
                : ""
            }
        </div>
    `,
    )
    .join("")
}

function updateStats() {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length
  const overdueTasks = tasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed",
  ).length

  document.getElementById("totalTasks").textContent = totalTasks
  document.getElementById("completedTasks").textContent = completedTasks
  document.getElementById("inProgressTasks").textContent = inProgressTasks
  document.getElementById("overdueTasks").textContent = overdueTasks

  const taskCountElement = document.getElementById("taskCount")
  if (taskCountElement) {
    taskCountElement.textContent = totalTasks
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("statusFilter").value = "all"
  document.getElementById("priorityFilter").value = "all"
  renderTasks()
}

// Data management functions
function exportData() {
  const data = {
    tasks: tasks,
    notes: notes,
    exportDate: new Date().toISOString(),
    version: "1.0",
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `study-planner-backup-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  alert("Data exported successfully!")
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.tasks && data.notes) {
          tasks = data.tasks
          notes = data.notes
          saveData()
          renderTasks()
          updateStats()
          alert("Data imported successfully!")
          toggleDataDialog()
        } else {
          alert("Invalid backup file format.")
        }
      } catch (error) {
        alert("Error reading backup file.")
      }
    }
    reader.readAsText(file)
  }
}

function importData() {
  document.getElementById("importFile").click()
}

function clearAllData() {
  if (confirm("Are you sure you want to delete all tasks and notes? This cannot be undone.")) {
    tasks = []
    notes = []
    saveData()
    renderTasks()
    updateStats()
    toggleDataDialog()
    alert("All data cleared successfully!")
  }
}
