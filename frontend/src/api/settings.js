import axiosInstance from './axiosInstance'

export const settingsAPI = {
  get: (params) => axiosInstance.get('/settings', { params }),
  getByCategory: (category, params) => axiosInstance.get(`/settings/category/${category}`, { params }),
  getSingle: (key, params) => axiosInstance.get(`/settings/${key}`, { params }),
  update: (data, config) => axiosInstance.put('/settings', data, config),
  bulkUpdate: (settings, params) => axiosInstance.put('/settings/bulk', { settings }, { params }),
  initialize: (params) => axiosInstance.post('/settings/initialize', {}, { params }),
  reset: (params) => axiosInstance.post('/settings/reset', {}, { params }),
  export: (params) => axiosInstance.get('/settings/export', { params }),
  import: (settings, params) => axiosInstance.post('/settings/import', { settings }, { params }),
  delete: (key, params) => axiosInstance.delete(`/settings/${key}`, { params }),
}

