/**
 * Axios Instance Configuration
 * Includes JWT token authentication
 */
import axios from 'axios'
import BaseUrl from './baseUrl.js'

const axiosInstance = axios.create({
  baseURL: `${BaseUrl}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add JWT token and company_id to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    const companyId = localStorage.getItem('companyId')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userRole = user.role || ''

    // Add JWT token to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Remove Content-Type for FormData to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    // Skip company_id for SuperAdmin routes
    const isSuperAdminRoute = config.url?.includes('/superadmin')

    // Auto-add company_id to requests if not already present
    // Skip for SuperAdmin as they manage ALL companies
    if (companyId && !isSuperAdminRoute && userRole !== 'SUPERADMIN') {
      const parsedCompanyId = parseInt(companyId, 10)

      // Only add if valid
      if (!isNaN(parsedCompanyId) && parsedCompanyId > 0) {
        // For GET requests, add to params
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            company_id: config.params?.company_id || parsedCompanyId
          }
        }
        // For POST, PUT, PATCH requests, add to body (only if body exists and company_id not already set)
        else if (['post', 'put', 'patch'].includes(config.method)) {
          // Don't modify FormData - it handles company_id separately
          if (config.data instanceof FormData) {
            // FormData already has company_id appended by the caller
            // Don't try to spread FormData as it breaks the upload
          } else if (config.data && typeof config.data === 'object') {
            config.data = {
              ...config.data,
              company_id: config.data.company_id || parsedCompanyId
            }
          }
        }
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and 401 unauthorized
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    // If 401 Unauthorized, clear auth and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('companyId')
      localStorage.removeItem('userId')

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance

