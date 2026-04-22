import axiosInstance from './axiosInstance'

export const timeTrackingAPI = {
  // CRUD operations
  getAll: (params) => axiosInstance.get('/time-logs', { params }),
  getById: (id, params) => axiosInstance.get(`/time-logs/${id}`, { params }),
  create: (data, params) => axiosInstance.post('/time-logs', data, { params }),
  update: (id, data, params) => axiosInstance.put(`/time-logs/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/time-logs/${id}`, { params }),
  
  // Statistics
  getStats: (params) => axiosInstance.get('/time-logs/stats', { params }),
}

