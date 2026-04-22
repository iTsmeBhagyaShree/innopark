import axiosInstance from './axiosInstance'

export const customFieldsAPI = {
  getAll: (params) => axiosInstance.get('/custom-fields', { params }),
  getById: (id) => axiosInstance.get(`/custom-fields/${id}`),
  create: (data) => axiosInstance.post('/custom-fields', data),
  update: (id, data) => axiosInstance.put(`/custom-fields/${id}`, data),
  delete: (id) => axiosInstance.delete(`/custom-fields/${id}`),
}

