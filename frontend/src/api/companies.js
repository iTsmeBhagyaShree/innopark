import axiosInstance from './axiosInstance'

export const companiesAPI = {
  getAll: (params) => axiosInstance.get('/companies', { params }),
  getById: (id) => axiosInstance.get(`/companies/${id}`),
  create: (data) => axiosInstance.post('/companies', data),
  update: (id, data) => axiosInstance.put(`/companies/${id}`, data),
  delete: (id) => axiosInstance.delete(`/companies/${id}`),
  addContact: (id, data) => axiosInstance.post(`/companies/${id}/contacts`, data),
  getContacts: (id) => axiosInstance.get(`/companies/${id}/contacts`),
  getActivities: (id, params) => axiosInstance.get(`/companies/${id}/activities`, { params }),
  addActivity: (id, data) => axiosInstance.post(`/companies/${id}/activities`, data),
}

