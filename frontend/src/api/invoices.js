import axiosInstance from './axiosInstance'

export const invoicesAPI = {
  getAll: (params) => axiosInstance.get('/invoices', { params }),
  getById: (id, params) => axiosInstance.get(`/invoices/${id}`, { params }),
  create: (data) => axiosInstance.post('/invoices', data),
  update: (id, data, params) => axiosInstance.put(`/invoices/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/invoices/${id}`, { params }),
  createFromTimeLogs: (data) => axiosInstance.post('/invoices/create-from-time-logs', data),
  createRecurring: (data) => axiosInstance.post('/invoices/create-recurring', data),
  generatePDF: (id, params) => axiosInstance.get(`/invoices/${id}/pdf`, { params }),
  sendEmail: (id, data, params) => axiosInstance.post(`/invoices/${id}/send-email`, data, { params }),
  updateStatus: (id, status, params) => axiosInstance.put(`/invoices/${id}/status`, { status }, { params }),
}

