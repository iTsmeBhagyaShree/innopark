import axiosInstance from './axiosInstance'

export const itemsAPI = {
  getAll: (params) => axiosInstance.get('/items', { params }),
  getById: (id, params) => axiosInstance.get(`/items/${id}`, { params }),
  create: (data) => axiosInstance.post('/items', data),
  update: (id, data, params) => axiosInstance.put(`/items/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/items/${id}`, { params }),
  import: (data) => axiosInstance.post('/items/import', data),
}

