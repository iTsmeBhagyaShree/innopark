import axiosInstance from './axiosInstance'

export const paymentsAPI = {
  getAll: (params) => axiosInstance.get('/payments', { params }),
  getById: (id, params) => axiosInstance.get(`/payments/${id}`, { params }),
  create: (data) => axiosInstance.post('/payments', data),
  createBulk: (data) => axiosInstance.post('/payments/bulk', data),
  update: (id, data, params) => axiosInstance.put(`/payments/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/payments/${id}`, { params }),
  sendReceipt: (id, data, params) => axiosInstance.post(`/payments/${id}/send-receipt`, data, { params }),
}

