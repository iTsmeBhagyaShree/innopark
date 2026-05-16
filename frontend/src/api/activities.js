import axiosInstance from './axiosInstance'

const sanitizeData = (data) => {
  const sanitized = { ...data };
  const numericFields = ['assigned_to', 'reference_id', 'company_id', 'lead_id', 'contact_id', 'deal_id', 'project_id'];
  const dateFields = ['deadline', 'meeting_date', 'follow_up_at'];

  numericFields.forEach(field => {
    if (sanitized[field] === '') sanitized[field] = null;
  });

  dateFields.forEach(field => {
    if (sanitized[field] === '') sanitized[field] = null;
  });

  return sanitized;
};

export const activitiesAPI = {
  getAll: (params) => axiosInstance.get('/activities', { params }),
  create: (data) => axiosInstance.post('/activities', sanitizeData(data)),
  update: (id, data) => axiosInstance.patch(`/activities/${id}`, sanitizeData(data)),
  togglePin: (id) => axiosInstance.patch(`/activities/${id}/pin`),
  delete: (id) => axiosInstance.delete(`/activities/${id}`),
}
