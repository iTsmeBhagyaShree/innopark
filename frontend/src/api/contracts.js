import axiosInstance from './axiosInstance'

export const contractsAPI = {
  getAll: (params) => axiosInstance.get('/contracts', { params }),
  getById: (id, params) => axiosInstance.get(`/contracts/${id}`, { params }),
  getPDF: (id, params) => axiosInstance.get(`/contracts/${id}/pdf`, { params, responseType: 'blob' }),
  create: (data) => axiosInstance.post('/contracts', data),
  update: (id, data, params) => axiosInstance.put(`/contracts/${id}`, data, { params }),
  updateStatus: (id, data, params) => axiosInstance.put(`/contracts/${id}/status`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/contracts/${id}`, { params }),
}

