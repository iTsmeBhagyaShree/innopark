import axiosInstance from './axiosInstance'

export const employeesAPI = {
  // CRUD operations
  getAll: (params) => axiosInstance.get('/employees', { params }),
  getById: (id, params) => axiosInstance.get(`/employees/${id}`, { params }),
  create: (data) => axiosInstance.post('/employees', data),
  update: (id, data, params) => axiosInstance.put(`/employees/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/employees/${id}`, { params }),
  
  // Profile operations (for employee dashboard)
  getProfile: (params) => axiosInstance.get('/employees/profile', { params }),
  updateProfile: (data, params) => axiosInstance.put('/employees/profile', data, { params }),
  
  // Dashboard stats
  getDashboardStats: (params) => axiosInstance.get('/employees/dashboard', { params }),
}

