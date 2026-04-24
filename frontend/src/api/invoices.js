import axiosInstance from './axiosInstance'

// Avoid 304 + stale empty cache: browser/agents revalidate list after create/edit.
const noCacheListConfig = (params) => ({
  params: { ...params, _t: Date.now() },
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
})

const withCompanyId = (params) => {
  const p = { ...(params || {}) }
  if (p.company_id == null || p.company_id === '') {
    const fromLs = localStorage.getItem('companyId') || localStorage.getItem('company_id')
    if (fromLs) {
      const n = parseInt(fromLs, 10)
      if (!Number.isNaN(n) && n > 0) p.company_id = n
    }
  }
  return p
}

export const invoicesAPI = {
  getAll: (params) => axiosInstance.get('/invoices', noCacheListConfig(withCompanyId(params))),
  getById: (id, params) =>
    axiosInstance.get(`/invoices/${id}`, noCacheListConfig(withCompanyId(params))),
  create: (data) => axiosInstance.post('/invoices', data),
  update: (id, data, params) => axiosInstance.put(`/invoices/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/invoices/${id}`, { params }),
  createFromTimeLogs: (data) => axiosInstance.post('/invoices/create-from-time-logs', data),
  createRecurring: (data) => axiosInstance.post('/invoices/create-recurring', data),
  generatePDF: (id, params) => axiosInstance.get(`/invoices/${id}/pdf`, { params }),
  sendEmail: (id, data, params) => axiosInstance.post(`/invoices/${id}/send-email`, data, { params }),
  updateStatus: (id, status, params) => axiosInstance.put(`/invoices/${id}/status`, { status }, { params }),
}

