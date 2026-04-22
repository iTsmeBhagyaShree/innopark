import axiosInstance from './axiosInstance'

export const meetingsAPI = {
    getAll: (params) => axiosInstance.get('/meetings', { params }),
    create: (data) => axiosInstance.post('/meetings', data),
    update: (id, data) => axiosInstance.put(`/meetings/${id}`, data),
    delete: (id) => axiosInstance.delete(`/meetings/${id}`)
}
