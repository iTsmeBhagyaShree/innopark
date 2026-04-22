import axiosInstance from './axiosInstance'

export const companyPackagesAPI = {
  getAll: (params) => axiosInstance.get('/company-packages', { params }),
  getById: (id) => axiosInstance.get(`/company-packages/${id}`),
  create: (data) => axiosInstance.post('/company-packages', data),
  update: (id, data) => axiosInstance.put(`/company-packages/${id}`, data),
  delete: (id) => axiosInstance.delete(`/company-packages/${id}`),
}

