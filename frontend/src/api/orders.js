import axiosInstance from './axiosInstance'

export const ordersAPI = {
  getAll: (params) => axiosInstance.get('/orders', { params }),
  getById: (id, params) => axiosInstance.get(`/orders/${id}`, { params }),
  create: (data) => axiosInstance.post('/orders', data),
  update: (id, data, params) => axiosInstance.put(`/orders/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/orders/${id}`, { params }),
  updateStatus: (id, status, params) => axiosInstance.patch(`/orders/${id}/status`, { status }, { params }),
  getPDF: (id, params) => axiosInstance.get(`/orders/${id}/pdf`, { params, responseType: 'blob' }),
}

