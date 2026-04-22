import axiosInstance from './axiosInstance';

// ================================================
// ATTENDANCE SETTINGS API
// ================================================

export const attendanceSettingsAPI = {
  // Get attendance settings
  getSettings: (companyId) => {
    return axiosInstance.get('/attendance-settings', {
      params: { company_id: companyId }
    });
  },

  // Update attendance settings
  updateSettings: (companyId, data) => {
    return axiosInstance.put('/attendance-settings', data, {
      params: { company_id: companyId }
    });
  },

  // ================================================
  // SHIFT MANAGEMENT
  // ================================================

  // Get all shifts
  getAllShifts: (companyId) => {
    return axiosInstance.get('/attendance-settings/shifts', {
      params: { company_id: companyId }
    });
  },

  // Get single shift
  getShiftById: (shiftId, companyId) => {
    return axiosInstance.get(`/attendance-settings/shifts/${shiftId}`, {
      params: { company_id: companyId }
    });
  },

  // Create new shift
  createShift: (companyId, shiftData) => {
    return axiosInstance.post('/attendance-settings/shifts', shiftData, {
      params: { company_id: companyId }
    });
  },

  // Update shift
  updateShift: (shiftId, companyId, shiftData) => {
    return axiosInstance.put(`/attendance-settings/shifts/${shiftId}`, shiftData, {
      params: { company_id: companyId }
    });
  },

  // Delete shift
  deleteShift: (shiftId, companyId) => {
    return axiosInstance.delete(`/attendance-settings/shifts/${shiftId}`, {
      params: { company_id: companyId }
    });
  },

  // Set default shift
  setDefaultShift: (shiftId, companyId) => {
    return axiosInstance.post(`/attendance-settings/shifts/${shiftId}/set-default`, {}, {
      params: { company_id: companyId }
    });
  },

  // ================================================
  // SHIFT ROTATION MANAGEMENT
  // ================================================

  // Get all rotations
  getAllRotations: (companyId) => {
    return axiosInstance.get('/attendance-settings/shift-rotations', {
      params: { company_id: companyId }
    });
  },

  // Create rotation
  createRotation: (companyId, rotationData) => {
    return axiosInstance.post('/attendance-settings/shift-rotations', rotationData, {
      params: { company_id: companyId }
    });
  },

  // Delete rotation
  deleteRotation: (rotationId, companyId) => {
    return axiosInstance.delete(`/attendance-settings/shift-rotations/${rotationId}`, {
      params: { company_id: companyId }
    });
  },

  // Run rotation
  runRotation: (companyId, rotationData) => {
    return axiosInstance.post('/attendance-settings/shift-rotations/run', rotationData, {
      params: { company_id: companyId }
    });
  }
};

