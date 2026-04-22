import axiosInstance from './axiosInstance'

export const subscriptionsAPI = {
  getAll: (params) => axiosInstance.get('/subscriptions', { params }),
  getById: (id, params) => axiosInstance.get(`/subscriptions/${id}`, { params }),
  create: (data) => axiosInstance.post('/subscriptions', data),
  update: (id, data, params) => axiosInstance.put(`/subscriptions/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/subscriptions/${id}`, { params }),
  cancel: (id, params) => axiosInstance.post(`/subscriptions/${id}/cancel`, {}, { params }),
}
