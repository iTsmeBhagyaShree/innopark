import axiosInstance from './axiosInstance'

export const expensesAPI = {
  // CRUD operations
  getAll: (params) => axiosInstance.get('/expenses', { params }),
  getById: (id, params) => axiosInstance.get(`/expenses/${id}`, { params }),
  create: (data) => axiosInstance.post('/expenses', data),
  update: (id, data, params) => axiosInstance.put(`/expenses/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/expenses/${id}`, { params }),

  // Approve/Reject
  approve: (id, params) => axiosInstance.post(`/expenses/${id}/approve`, {}, { params }),
  reject: (id, data, params) => axiosInstance.post(`/expenses/${id}/reject`, data, { params }),

  // Categories
  getCategories: (params) => axiosInstance.get('/expenses/categories', { params }),

  // Export endpoints
  exportExcel: (params) => axiosInstance.get('/expenses/export/excel', {
    params,
    responseType: 'blob'
  }),
  exportPrint: (params) => axiosInstance.get('/expenses/export/print', { params }),

  // File upload
  uploadFile: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(`/expenses/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}
