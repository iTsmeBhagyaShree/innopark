import axiosInstance from './axiosInstance'

// Professional Dummy Data for Frontend Fallback
const MOCK_DASHBOARD = {
  success: true,
  data: {
    summary: { clockIn: "08:15:22", isClockedIn: true, openTasks: 12, eventsToday: 3, dueAmount: 1450.50 },
    projectsOverview: { open: 8, completed: 15, progress: 65 },
    incomeVsExpenses: { current: { income: 154000, expenses: 92000 } },
    teamOverview: { total: 15, clockedIn: 12, lastAnnouncement: "Welcome to Innopark CRM!" },
    timeline: [
      { id: 1, user: "Kavya", action: "Reviewing Project Alpha", status: "In Progress", time: new Date() },
      { id: 2, user: "Devesh", action: "Database Task", status: "Completed", time: new Date() }
    ],
    openProjects: [
      { id: 1, name: "Innopark Web App", deadline: "2025-12-01", progress: 75 },
      { id: 2, name: "CRM Integration", deadline: "2025-11-20", progress: 40 }
    ],
    todos: [ { id: 1, text: "Welcome to Innopark CRM", completed: true } ]
  }
};

const MOCK_ADMIN_STATS = {
  success: true,
  data: {
    leads: 45, employees: 12, projects: 8,
    invoices: { total: 15, amount: 12500 },
    leadsBySource: [ { source: "Google", count: 25 }, { source: "Direct", count: 20 } ],
    pipelineStages: [ { stage: "New", value: 5000 }, { stage: "Won", value: 8500 } ],
    events_today: 3
  }
};

export const dashboardAPI = {
  getSuperAdminStats: () => axiosInstance.get('/dashboard/superadmin').catch(() => ({ data: MOCK_DASHBOARD })),
  
  getAdminStats: (params) => axiosInstance.get('/dashboard/admin', { params })
    .then(res => res.data)
    .catch(() => MOCK_ADMIN_STATS),
  
  getEmployeeStats: (params) => axiosInstance.get('/dashboard/employee', { params })
    .then(res => res.data)
    .catch(() => ({ success: true, data: { my_tasks: 5, my_projects: 2, time_logged_today: "6h", upcoming_events: 1 } })),
  
  getClientStats: (params) => axiosInstance.get('/dashboard/client', { params }).then(res => res.data),
  
  getAll: (params) => axiosInstance.get('/dashboard', { params })
    .then(res => res.data)
    .catch(() => MOCK_DASHBOARD),
  
  saveTodo: (data) => axiosInstance.post('/dashboard/todo', data),
  updateTodo: (id, data) => axiosInstance.put(`/dashboard/todo/${id}`, data),
  deleteTodo: (id) => axiosInstance.delete(`/dashboard/todo/${id}`),
  saveStickyNote: (data) => axiosInstance.post('/dashboard/sticky-note', data),
}

