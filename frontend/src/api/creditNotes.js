import axiosInstance from './axiosInstance'

export const creditNotesAPI = {
  getAll: (params) => axiosInstance.get('/credit-notes', { params }),
  getById: (id, params) => axiosInstance.get(`/credit-notes/${id}`, { params }),
  create: (data) => axiosInstance.post('/credit-notes', data),
  update: (id, data, params) => axiosInstance.put(`/credit-notes/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/credit-notes/${id}`, { params }),
  applyToInvoice: (id, data, params) => axiosInstance.post(`/credit-notes/${id}/apply`, data, { params }),
}

