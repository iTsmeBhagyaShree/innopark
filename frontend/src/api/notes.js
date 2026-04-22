import axiosInstance from './axiosInstance'

export const notesAPI = {
  getAll: (params) => axiosInstance.get('/notes', { params }),
  getById: (id, params) => axiosInstance.get(`/notes/${id}`, { params }),
  create: (data) => axiosInstance.post('/notes', data),
  update: (id, data, params) => axiosInstance.put(`/notes/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/notes/${id}`, { params }),
}

