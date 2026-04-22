import axiosInstance from './axiosInstance'

// Master contact list (single source of truth) - use /contacts
const master = (params) => axiosInstance.get('/contacts', { params })
const masterGetById = (id, params) => axiosInstance.get(`/contacts/${id}`, { params })
const masterCreate = (data, params) => axiosInstance.post('/contacts', data, { params })
const masterUpdate = (id, data, params) => axiosInstance.put(`/contacts/${id}`, data, { params })
const masterDelete = (id, params) => axiosInstance.delete(`/contacts/${id}`, { params })

export const contactsAPI = {
  // Master list (Contact tab + Deal "Link contact" picker)
  getMasterList: master,
  getMasterById: masterGetById,
  createMaster: masterCreate,
  updateMaster: masterUpdate,
  deleteMaster: masterDelete,
  // Legacy /leads/contacts (same data, backward compatible)
  getAll: (params) => axiosInstance.get('/leads/contacts', { params }),
  getById: (id, params) => axiosInstance.get(`/leads/contacts/${id}`, { params }),
  create: (data, params) => axiosInstance.post('/leads/contacts', data, { params }),
  update: (id, data, params) => axiosInstance.put(`/leads/contacts/${id}`, data, { params }),
  delete: (id, params) => axiosInstance.delete(`/leads/contacts/${id}`, { params }),
}

