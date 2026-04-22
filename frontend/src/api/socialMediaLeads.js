import axiosInstance from './axiosInstance'

export const socialMediaLeadsAPI = {
  getAll: (params) => axiosInstance.get('/social-media-integrations', { params }),
  getById: (id) => axiosInstance.get(`/social-media-integrations/${id}`),
  create: (data) => axiosInstance.post('/social-media-integrations', data),
  update: (id, data) => axiosInstance.put(`/social-media-integrations/${id}`, data),
  delete: (id) => axiosInstance.delete(`/social-media-integrations/${id}`),
}

