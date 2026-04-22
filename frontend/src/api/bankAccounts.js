import axiosInstance from './axiosInstance'

export const bankAccountsAPI = {
  getAll: (params) => axiosInstance.get('/bank-accounts', { params }),
  getById: (id, params) => axiosInstance.get(`/bank-accounts/${id}`, { params }),
  create: (data) => axiosInstance.post('/bank-accounts', data),
  update: (id, data, params) => axiosInstance.put(`/bank-accounts/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/bank-accounts/${id}`, { params }),
  getTransactions: (id, params) => axiosInstance.get(`/bank-accounts/${id}/transactions`, { params }),
  setDefault: (id, params) => axiosInstance.put(`/bank-accounts/${id}/set-default`, {}, { params }),
}

