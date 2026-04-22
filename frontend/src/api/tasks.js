import axiosInstance from './axiosInstance'

export const tasksAPI = {
  // CRUD operations
  getAll: (params) => axiosInstance.get('/tasks', { params }),
  getById: (id, params) => axiosInstance.get(`/tasks/${id}`, { params }),
  create: (data, params) => axiosInstance.post('/tasks', data, { params }),
  createWithFile: (formData, params) => axiosInstance.post('/tasks', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    params
  }),
  update: (id, data, params) => axiosInstance.put(`/tasks/${id}`, data, { params }),
  updateWithFile: (id, formData, params) => axiosInstance.put(`/tasks/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    params
  }),
  delete: (id, params) => axiosInstance.delete(`/tasks/${id}`, { params }),
  markComplete: (id) => axiosInstance.put(`/tasks/${id}/complete`),
  reopen: (id) => axiosInstance.put(`/tasks/${id}/reopen`),

  // Comments
  getComments: (id, params) => axiosInstance.get(`/tasks/${id}/comments`, { params }),
  addComment: (id, data, params) => axiosInstance.post(`/tasks/${id}/comments`, data, { params }),

  // Files
  getFiles: (id, params) => axiosInstance.get(`/tasks/${id}/files`, { params }),
  uploadFile: (id, formData, params) => axiosInstance.post(`/tasks/${id}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    params
  }),
}

