import axiosInstance from './axiosInstance'

export const leaveRequestsAPI = {
  getAll: (params) => axiosInstance.get('/leave-requests', { params }),
  getById: (id, params) => axiosInstance.get(`/leave-requests/${id}`, { params }),
  create: (data) => axiosInstance.post('/leave-requests', data),
  update: (id, data, params) => axiosInstance.put(`/leave-requests/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/leave-requests/${id}`, { params }),
}

