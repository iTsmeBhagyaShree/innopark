import axiosInstance from './axiosInstance'

export const activitiesAPI = {
  getAll: (params) => axiosInstance.get('/activities', { params }),
  create: (data) => axiosInstance.post('/activities', data),
  update: (id, data) => axiosInstance.patch(`/activities/${id}`, data),
  togglePin: (id) => axiosInstance.patch(`/activities/${id}/pin`),
  delete: (id) => axiosInstance.delete(`/activities/${id}`),
}
