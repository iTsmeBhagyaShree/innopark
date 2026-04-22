import axiosInstance from './axiosInstance'

export const ticketsAPI = {
  getAll: (params) => axiosInstance.get('/tickets', { params }),
  getById: (id, params) => axiosInstance.get(`/tickets/${id}`, { params }),
  create: (data) => axiosInstance.post('/tickets', data),
  update: (id, data) => axiosInstance.put(`/tickets/${id}`, data),
  delete: (id, params) => axiosInstance.delete(`/tickets/${id}`, { params }),
  addComment: (id, data) => axiosInstance.post(`/tickets/${id}/comments`, data),
}

