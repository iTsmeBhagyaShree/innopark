import axiosInstance from './axiosInstance'

export const documentsAPI = {
  getAll: (params) => axiosInstance.get('/documents', { params }),
  getById: (id, params) => axiosInstance.get(`/documents/${id}`, { params }),
  create: (formData) => axiosInstance.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  update: (id, data, params) => axiosInstance.put(`/documents/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/documents/${id}`, { params }),
  download: (id, params) => {
    // Don't manually add query string - axios interceptor handles company_id
    return axiosInstance.get(`/documents/${id}/download`, {
      params,
      responseType: 'blob'
    })
  },
}

