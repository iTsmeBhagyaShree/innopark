import axiosInstance from './axiosInstance'

export const leadSourcesAPI = {
  getAll: (params) => axiosInstance.get('/lead-sources', { params }),
  getById: (id, params) => axiosInstance.get(`/lead-sources/${id}`, { params }),
  create: (data) => axiosInstance.post('/lead-sources', data),
  update: (id, data) => axiosInstance.put(`/lead-sources/${id}`, data),
  delete: (id) => axiosInstance.delete(`/lead-sources/${id}`),
}
