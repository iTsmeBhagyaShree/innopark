import axiosInstance from './axiosInstance'

export const usersAPI = {
  getAll: (params) => axiosInstance.get('/users', { params }),
  create: (data) => axiosInstance.post('/users', data),
  resetPassword: (id) => axiosInstance.post(`/users/${id}/reset-password`),
}

