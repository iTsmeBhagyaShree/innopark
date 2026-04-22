import axiosInstance from './axiosInstance';

// ================================================
// LEAVE SETTINGS API
// ================================================

export const leaveSettingsAPI = {
  // ================================================
  // LEAVE TYPES MANAGEMENT
  // ================================================

  // Get all leave types
  getAllLeaveTypes: (companyId, includeArchived = false) => {
    return axiosInstance.get('/leave-settings/leave-types', {
      params: { 
        company_id: companyId,
        include_archived: includeArchived === true ? 'true' : 'false'
      }
    });
  },

  // Get single leave type
  getLeaveTypeById: (leaveTypeId, companyId) => {
    return axiosInstance.get(`/leave-settings/leave-types/${leaveTypeId}`, {
      params: { company_id: companyId }
    });
  },

  // Create new leave type
  createLeaveType: (companyId, leaveTypeData) => {
    return axiosInstance.post('/leave-settings/leave-types', leaveTypeData, {
      params: { company_id: companyId }
    });
  },

  // Update leave type
  updateLeaveType: (leaveTypeId, companyId, leaveTypeData) => {
    return axiosInstance.put(`/leave-settings/leave-types/${leaveTypeId}`, leaveTypeData, {
      params: { company_id: companyId }
    });
  },

  // Delete leave type
  deleteLeaveType: (leaveTypeId, companyId) => {
    return axiosInstance.delete(`/leave-settings/leave-types/${leaveTypeId}`, {
      params: { company_id: companyId }
    });
  },

  // Archive leave type
  archiveLeaveType: (leaveTypeId, companyId) => {
    return axiosInstance.post(`/leave-settings/leave-types/${leaveTypeId}/archive`, {}, {
      params: { company_id: companyId }
    });
  },

  // Restore archived leave type
  restoreLeaveType: (leaveTypeId, companyId) => {
    return axiosInstance.post(`/leave-settings/leave-types/${leaveTypeId}/restore`, {}, {
      params: { company_id: companyId }
    });
  },

  // ================================================
  // LEAVE GENERAL SETTINGS
  // ================================================

  // Get leave general settings
  getGeneralSettings: (companyId) => {
    return axiosInstance.get('/leave-settings/general-settings', {
      params: { company_id: companyId }
    });
  },

  // Update leave general settings
  updateGeneralSettings: (companyId, settingsData) => {
    return axiosInstance.post('/leave-settings/general-settings', settingsData, {
      params: { company_id: companyId }
    });
  }
};

