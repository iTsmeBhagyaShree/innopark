// =====================================================
// Notification Settings API
// =====================================================

import axiosInstance from './axiosInstance';

const notificationSettingsAPI = {
  getAll: (params) => axiosInstance.get('/notification-settings', { params }),
  getById: (id, params) => axiosInstance.get(`/notification-settings/${id}`, { params }),
  update: (id, data, params) => axiosInstance.put(`/notification-settings/${id}`, data, { params }),
  getCategories: (params) => axiosInstance.get('/notification-settings/categories', { params }),
};

export default notificationSettingsAPI;

