import axiosInstance from './axiosInstance'

export const notificationsAPI = {
  getAll: (params) => axiosInstance.get('/notifications', { params }),
  getById: (id, params) => axiosInstance.get(`/notifications/${id}`, { params }),
  create: (data) => axiosInstance.post('/notifications', data),
  markAsRead: (id, params) => axiosInstance.put(`/notifications/${id}/read`, null, { params }),
  markAllAsRead: (params) => axiosInstance.put('/notifications/mark-all-read', null, { params }),
  getUnreadCount: (params) => axiosInstance.get('/notifications/unread-count', { params }),
  delete: (id, params) => axiosInstance.delete(`/notifications/${id}`, { params }),
}

