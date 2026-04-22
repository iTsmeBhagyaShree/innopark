import axiosInstance from './axiosInstance'

export const departmentsAPI = {
  getAll: (params) => axiosInstance.get('/departments', { params }),
  getById: (id, params) => axiosInstance.get(`/departments/${id}`, { params }),
  create: (data) => axiosInstance.post('/departments', data),
  update: (id, data, params) => axiosInstance.put(`/departments/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/departments/${id}`, { params }),
}

