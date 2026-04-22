import axiosInstance from './axiosInstance'

export const financeTemplatesAPI = {
  getAll: (params) => axiosInstance.get('/finance-templates', { params }),
  getById: (id) => axiosInstance.get(`/finance-templates/${id}`),
  create: (data) => axiosInstance.post('/finance-templates', data),
  update: (id, data) => axiosInstance.put(`/finance-templates/${id}`, data),
  delete: (id) => axiosInstance.delete(`/finance-templates/${id}`),
  generateReport: (id, data, format = 'pdf') => axiosInstance.post(`/finance-templates/${id}/generate-report`, { data, format }),
}

