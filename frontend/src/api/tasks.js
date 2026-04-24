import axiosInstance from './axiosInstance'

const noCacheListConfig = (params) => ({
  params: { ...params, _t: Date.now() },
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
})

const withCompanyId = (params) => {
  const p = { ...(params || {}) }
  if (p.company_id == null || p.company_id === '') {
    const fromLs = localStorage.getItem('companyId') || localStorage.getItem('company_id')
    if (fromLs) {
      const n = parseInt(fromLs, 10)
      if (!Number.isNaN(n) && n > 0) p.company_id = n
    }
  }
  return p
}

export const tasksAPI = {
  // CRUD operations
  getAll: (params) => axiosInstance.get('/tasks', noCacheListConfig(withCompanyId(params || {}))),
  getById: (id, params) =>
    axiosInstance.get(`/tasks/${id}`, noCacheListConfig(withCompanyId(params || {}))),
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

