/**
 * PWA API Functions
 * Progressive Web App Settings Management
 */

import axiosInstance from './axiosInstance';
import BaseUrl from './baseUrl';

/**
 * Get PWA Settings (Public - No Auth Required)
 * @returns {Promise} PWA settings data
 */
export const getPwaSettings = async () => {
    try {
        const response = await axiosInstance.get('/pwa');
        return response.data;
    } catch (error) {
        console.error('Error fetching PWA settings:', error);
        // Return default settings on error
        return {
            success: true,
            data: {
                enabled: false,
                app_name: 'Develo CRM',
                short_name: 'CRM',
                description: 'A powerful CRM solution',
                theme_color: '#6366f1',
                background_color: '#ffffff',
                icon_url: null
            }
        };
    }
};

/**
 * Update PWA Settings (Super Admin Only)
 * @param {Object} data - PWA settings data
 * @returns {Promise} Updated settings
 */
export const updatePwaSettings = async (data) => {
    const response = await axiosInstance.put('/pwa', data);
    return response.data;
};

/**
 * Update PWA Settings with Icon Upload
 * @param {FormData} formData - Form data with settings and optional icon
 * @returns {Promise} Updated settings
 */
export const updatePwaSettingsWithIcon = async (formData) => {
    const response = await axiosInstance.put('/pwa', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Get PWA Manifest URL
 * @returns {string} Manifest URL
 */
export const getManifestUrl = () => {
    return `${BaseUrl}/api/v1/pwa/manifest`;
};

export default {
    getPwaSettings,
    updatePwaSettings,
    updatePwaSettingsWithIcon,
    getManifestUrl
};
