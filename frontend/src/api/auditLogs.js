import axiosInstance from './axiosInstance'

export const auditLogsAPI = {
  getAll: (params) => axiosInstance.get('/audit-logs', { params }),
  getById: (id) => axiosInstance.get(`/audit-logs/${id}`),
  create: (data) => axiosInstance.post('/audit-logs', data),
}

