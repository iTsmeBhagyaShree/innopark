import axiosInstance from './axiosInstance'

export const projectsAPI = {
  // CRUD operations
  getAll: (params) => axiosInstance.get('/projects', { params }),
  getById: (id, params) => axiosInstance.get(`/projects/${id}`, { params }),
  create: (data, params) => axiosInstance.post('/projects', data, { params }),
  update: (id, data, params) => axiosInstance.put(`/projects/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/projects/${id}`, { params }),

  // Additional endpoints
  getFilters: (params) => axiosInstance.get('/projects/filters', { params }),
  uploadFile: (id, formData, params) => {
    // Don't set Content-Type header - let axios set it automatically with boundary
    // Setting it manually can break multipart/form-data
    return axiosInstance.post(`/projects/${id}/upload`, formData, {
      params,
      headers: {
        // Remove Content-Type - axios will set it automatically with the correct boundary
      }
    })
  },

  // Get project members
  getMembers: (id, params) => axiosInstance.get(`/projects/${id}/members`, { params }),

  // Get project tasks
  getTasks: (id, params) => axiosInstance.get(`/projects/${id}/tasks`, { params }),

  // Get project files
  getFiles: (id, params) => axiosInstance.get(`/projects/${id}/files`, { params }),

  // Label management
  getAllLabels: (params) => axiosInstance.get('/projects/labels', { params }),
  createLabel: (data, params) => axiosInstance.post('/projects/labels', data, { params }),
  deleteLabel: (id, params) => axiosInstance.delete(`/projects/labels/${id}`, { params }),
}

