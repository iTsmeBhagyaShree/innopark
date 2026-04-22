import axiosInstance from './axiosInstance'

export const projectTemplatesAPI = {
  getAll: (params) => axiosInstance.get('/project-templates', { params }),
  getById: (id, params) => axiosInstance.get(`/project-templates/${id}`, { params }),
  create: (data) => axiosInstance.post('/project-templates', data),
  update: (id, data) => axiosInstance.put(`/project-templates/${id}`, data),
  delete: (id, params) => axiosInstance.delete(`/project-templates/${id}`, { params }),
}

