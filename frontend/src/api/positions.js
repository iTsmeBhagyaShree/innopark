import axiosInstance from './axiosInstance'

export const positionsAPI = {
  getAll: (params) => axiosInstance.get('/positions', { params }),
  getById: (id, params) => axiosInstance.get(`/positions/${id}`, { params }),
  create: (data) => axiosInstance.post('/positions', data),
  update: (id, data, params) => axiosInstance.put(`/positions/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/positions/${id}`, { params }),
}

