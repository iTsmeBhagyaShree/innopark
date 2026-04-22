import axiosInstance from './axiosInstance'

export const estimatesAPI = {
  getAll: (params) => axiosInstance.get('/offers', { params }),
  getById: (id, params) => axiosInstance.get(`/offers/${id}`, { params }),
  create: (data) => axiosInstance.post('/offers', data),
  update: (id, data, params) => axiosInstance.put(`/offers/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/offers/${id}`, { params }),
  convertToInvoice: (id, data, params) => axiosInstance.post(`/offers/${id}/convert-to-invoice`, data, { params }),
  sendEmail: (id, data, params) => axiosInstance.post(`/offers/${id}/send-email`, data, { params }),
  updateStatus: (id, status, params) => axiosInstance.put(`/offers/${id}/status`, { status }, { params }),
  duplicate: (id, params) => axiosInstance.post(`/offers/${id}/duplicate`, {}, { params }),
  getPDF: (id, params) => axiosInstance.get(`/offers/${id}/pdf`, { params, responseType: 'blob' }),
}

