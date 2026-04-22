import axiosInstance from './axiosInstance'

export const eventsAPI = {
  // CRUD operations
  getAll: (params) => axiosInstance.get('/events', { params }),
  getById: (id, params) => axiosInstance.get(`/events/${id}`, { params }),
  create: (data, params) => axiosInstance.post('/events', data, { params }),
  update: (id, data, params) => axiosInstance.put(`/events/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/events/${id}`, { params }),
  
  // Special endpoints
  getUpcoming: (params) => axiosInstance.get('/events/upcoming', { params }),
}

