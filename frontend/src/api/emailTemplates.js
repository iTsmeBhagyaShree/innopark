import axiosInstance from './axiosInstance'

export const emailTemplatesAPI = {
  getAll: (params) => axiosInstance.get('/email-templates', { params }),
  getById: (id) => axiosInstance.get(`/email-templates/${id}`),
  getByTemplateKey: (templateKey, params) => axiosInstance.get(`/email-templates/key/${templateKey}`, { params }),
  create: (data) => axiosInstance.post('/email-templates', data),
  update: (id, data) => axiosInstance.put(`/email-templates/${id}`, data),
  delete: (id) => axiosInstance.delete(`/email-templates/${id}`),
}

