import axiosInstance from './axiosInstance'

export const proposalsAPI = {
  getAll: (params) => axiosInstance.get('/deals', { params }),
  getById: (id, params) => axiosInstance.get(`/deals/${id}`, { params }),
  create: (data) => axiosInstance.post('/deals', data),
  update: (id, data, params) => axiosInstance.put(`/deals/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/deals/${id}`, { params }),
  convertToInvoice: (id, data, params) => axiosInstance.post(`/deals/${id}/convert-to-invoice`, data, { params }),
  getFilters: (params) => axiosInstance.get('/deals/filters', { params }),
  updateStatus: (id, status, params) => axiosInstance.put(`/deals/${id}/status`, { status }, { params }),
  duplicate: (id, params) => axiosInstance.post(`/deals/${id}/duplicate`, {}, { params }),
  sendEmail: (id, data, params) => axiosInstance.post(`/deals/${id}/send-email`, data, { params }),
  getPDF: (id, params) => axiosInstance.get(`/deals/${id}/pdf`, { params, responseType: 'json' }),
  // Deal contacts (link existing master contacts only)
  getContacts: (dealId, params) => axiosInstance.get(`/deals/${dealId}/contacts`, { params }),
  addContact: (dealId, data) => axiosInstance.post(`/deals/${dealId}/contacts`, data),
  removeContact: (dealId, contactId) => axiosInstance.delete(`/deals/${dealId}/contacts/${contactId}`),
}

