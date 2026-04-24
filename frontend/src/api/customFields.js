import axiosInstance from './axiosInstance'

export const customFieldsAPI = {
  getAll: (params) => axiosInstance.get('/custom-fields', { params }),
  getById: (id, params) => axiosInstance.get(`/custom-fields/${id}`, { params }),
  create: (data) => axiosInstance.post('/custom-fields', data),
  update: (id, data) => axiosInstance.put(`/custom-fields/${id}`, data),
  /** Backend expects `company_id` in query for tenant check */
  delete: (id, params) => axiosInstance.delete(`/custom-fields/${id}`, { params: params || {} }),
}

