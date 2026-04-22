import axiosInstance from './axiosInstance'

export const authAPI = {
  login: (data) => axiosInstance.post('/auth/login', data),
  logout: () => axiosInstance.post('/auth/logout'),
  getCurrentUser: (params) => axiosInstance.get('/auth/me', { params }),
  updateProfile: (data, params) => axiosInstance.put('/auth/me', data, { params }),
  changePassword: (data, params) => axiosInstance.put('/auth/change-password', data, { params }),
}

