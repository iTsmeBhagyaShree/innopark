import axiosInstance from './axiosInstance'

export const messagesAPI = {
  getAll: (params) => axiosInstance.get('/messages', { params }),
  getById: (id, params) => axiosInstance.get(`/messages/${id}`, { params }),
  getConversation: (userId, params) => axiosInstance.get('/messages', { 
    params: { ...params, conversation_with: userId } 
  }),
  getAvailableUsers: (params) => axiosInstance.get('/messages/available-users', { params }),
  create: (data) => axiosInstance.post('/messages', data),
  update: (id, data) => axiosInstance.put(`/messages/${id}`, data),
  delete: (id) => axiosInstance.delete(`/messages/${id}`),
  markAsRead: (id) => axiosInstance.put(`/messages/${id}`, { is_read: true }),
}
