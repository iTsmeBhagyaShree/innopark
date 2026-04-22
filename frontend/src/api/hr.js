import axiosInstance from './axiosInstance';

export const hrAPI = {
    getShifts: () => axiosInstance.get('/hr/shifts'),
    createShift: (data) => axiosInstance.post('/hr/shifts', data),
    deleteShift: (id) => axiosInstance.delete(`/hr/shifts/${id}`),

    getLeaveTypes: () => axiosInstance.get('/hr/leave-types'),
    createLeaveType: (data) => axiosInstance.post('/hr/leave-types', data),
    deleteLeaveType: (id) => axiosInstance.delete(`/hr/leave-types/${id}`),

    getAttendanceSettings: () => axiosInstance.get('/hr/attendance-settings'),
    updateAttendanceSettings: (data) => axiosInstance.put('/hr/attendance-settings', data),
};
