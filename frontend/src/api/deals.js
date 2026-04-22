import axiosInstance from './axiosInstance'

export const dealsAPI = {
    getAll: (params) => axiosInstance.get('/deals', { params }),
    getById: (id, params) => axiosInstance.get(`/deals/${id}`, { params }),
    create: (data) => axiosInstance.post('/deals', data),
    update: (id, data) => axiosInstance.put(`/deals/${id}`, data),
    updateStage: (id, data) => axiosInstance.patch(`/deals/${id}/stage`, data),
    delete: (id) => axiosInstance.delete(`/deals/${id}`),
    getKanbanStats: (params) => axiosInstance.get('/deals/kanban-stats', { params }),

    // Contacts
    getDealContacts: (id) => axiosInstance.get(`/deals/${id}/contacts`),
    addContact: (id, data) => axiosInstance.post(`/deals/${id}/contacts`, data),
    removeContact: (id, contactId) => axiosInstance.delete(`/deals/${id}/contacts/${contactId}`),

    // Activities
    getActivities: (id, params) => axiosInstance.get(`/deals/${id}/activities`, { params }),
    addActivity: (id, data) => axiosInstance.post(`/deals/${id}/activities`, data),
}
