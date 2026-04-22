import axiosInstance from './axiosInstance';

const rolesAPI = {
    getAll: (params) => axiosInstance.get('/roles', { params }),
    getPermissions: (id) => axiosInstance.get(`/roles/${id}/permissions`),
    updatePermissions: (id, permissions) => axiosInstance.put(`/roles/${id}/permissions`, { permissions }),
    create: (data) => axiosInstance.post('/roles', data),
    delete: (id) => axiosInstance.delete(`/roles/${id}`)
};

export default rolesAPI;
