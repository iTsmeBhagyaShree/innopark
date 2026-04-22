import axiosInstance from './axiosInstance'

export const leadsAPI = {
  getAll: (params) => axiosInstance.get('/leads', { params }),
  getById: (id, params) => axiosInstance.get(`/leads/${id}`, { params }),
  create: (data) => axiosInstance.post('/leads', data),
  update: (id, data, params) => axiosInstance.put(`/leads/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/leads/${id}`, { params }),
  convertToClient: (id, data, params) => axiosInstance.post(`/leads/${id}/convert-to-client`, data, { params }),
  getOverview: (params) => axiosInstance.get('/leads/overview', { params }),
  updateStatus: (id, data, params) => axiosInstance.put(`/leads/${id}/update-status`, data, { params }),
  bulkAction: (data) => axiosInstance.post('/leads/bulk-action', data),

  // Label management
  getAllLabels: (params) => axiosInstance.get('/leads/labels', { params }),
  createLabel: (data) => axiosInstance.post('/leads/labels', data),
  deleteLabel: (label, params) => axiosInstance.delete(`/leads/labels/${encodeURIComponent(label)}`, { params }),
  updateLeadLabels: (id, data, params) => axiosInstance.put(`/leads/${id}/labels`, data, { params }),

  // Import leads
  importLeads: (data) => axiosInstance.post('/leads/import', data),

  // Contact management
  addContact: (id, data) => axiosInstance.post(`/leads/${id}/contacts`, data),
  removeContact: (id, contactId) => axiosInstance.delete(`/leads/${id}/contacts/${contactId}`),
  getContacts: (id) => axiosInstance.get(`/leads/${id}/contacts`),
  updateStage: (id, data) => axiosInstance.patch(`/leads/${id}/stage`, data),
}

