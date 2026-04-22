import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const defaultAuthValue = {
  user: null,
  loading: true,
  login: async () => ({ success: false, error: 'Not authenticated' }),
  signup: async () => ({ success: false, error: 'Not authenticated' }),
  logout: async () => {},
}

const AuthContext = createContext(defaultAuthValue)

export const useAuth = () => {
  const context = useContext(AuthContext)
  // Context will always have a value (either default or from provider)
  return context
}

export const AuthProvider = ({ children }) => {
  // IMPORTANT: Initialize user from localStorage immediately to prevent sidebar flicker
  const getStoredUser = () => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        return JSON.parse(storedUser)
      }
    } catch (e) {
      console.error('Error parsing stored user:', e)
    }
    return null
  }
  
  const [user, setUser] = useState(getStoredUser) // Initialize with stored user immediately
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth on mount and verify token
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('authToken') || localStorage.getItem('token')
      const storedUserId = localStorage.getItem('userId')
      
      if (storedToken) {
        try {
          // Pass user_id as query param as fallback
          const response = await authAPI.getCurrentUser({ user_id: storedUserId })
          if (response.data.success) {
            const userData = response.data.data
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
            localStorage.setItem('userId', userData.id)
            localStorage.setItem('userRole', userData.role)
            localStorage.setItem('userEmail', userData.email)
            if (userData.company_id) {
              localStorage.setItem('companyId', userData.company_id)
            }
            if (userData.company_name) {
              localStorage.setItem('companyName', userData.company_name)
            }
          }
        } catch (error) {
          console.error('Auth check error:', error)
          // Token invalid, clear storage only if it's an auth error
          if (error.response?.status === 401) {
            localStorage.removeItem('authToken')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('userId')
            localStorage.removeItem('userRole')
            localStorage.removeItem('companyId')
            setUser(null)
          }
          // For other errors, keep the stored user data
        }
      } else {
        // No token, clear user
        setUser(null)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email, password, role, retryCount = 0) => {
    try {
      // Check if we're still in rate limit cooldown period
      const retryAfter = localStorage.getItem('loginRetryAfter')
      if (retryAfter && Date.now() < parseInt(retryAfter)) {
        const secondsLeft = Math.ceil((parseInt(retryAfter) - Date.now()) / 1000)
        return { 
          success: false, 
          error: `Too many login attempts. Please wait ${secondsLeft} seconds before trying again.`,
          isRateLimited: true,
          retryAfter: secondsLeft
        }
      }

      // Clear retry after if time has passed
      if (retryAfter && Date.now() >= parseInt(retryAfter)) {
        localStorage.removeItem('loginRetryAfter')
      }

      const loginData = { email, password, role }

      const response = await authAPI.login(loginData)
      if (response.data.success) {
        // API returns { success: true, token: "...", user: {...} }
        const token = response.data.token || response.data.data?.token
        const userData = response.data.user || response.data.data?.user
        
        if (!token || !userData) {
          return { success: false, error: 'Invalid response from server' }
        }
        
        // Clear any retry after on successful login
        localStorage.removeItem('loginRetryAfter')
        
        // Store auth data
        localStorage.setItem('authToken', token)
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('userId', userData.id)
        localStorage.setItem('userRole', userData.role)
        localStorage.setItem('userEmail', userData.email)
        if (userData.company_id) {
          localStorage.setItem('companyId', userData.company_id)
        }
        if (userData.company_name) {
          localStorage.setItem('companyName', userData.company_name)
        }
        
        setUser(userData)
        return { success: true, user: userData }
      } else {
        return { success: false, error: response.data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle 429 rate limiting error
      if (error.response?.status === 429) {
        const retryAfter = error.retryAfter || error.response?.headers?.['retry-after'] || 60
        const retryAfterMs = Date.now() + (retryAfter * 1000)
        localStorage.setItem('loginRetryAfter', retryAfterMs.toString())
        
        return { 
          success: false, 
          error: error.userMessage || error.response?.data?.message || 
            `Too many login attempts. Please wait ${retryAfter} seconds before trying again.`,
          isRateLimited: true,
          retryAfter: retryAfter
        }
      }
      
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      })
      // Check if it's a CORS or Network error (where backend is unreachable due to mobile data blocks)
      const errorMsg = error.message === 'Network Error'
        ? 'Network Error: Unreachable Backend API. Try switching from mobile data to WiFi, or check your internet connection.'
        : (error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed. Please check your credentials.')

      return { 
        success: false, 
        error: errorMsg
      }
    }
  }

  const signup = async (email, password, name, role = 'EMPLOYEE') => {
    // Signup would typically be handled by admin creating users
    // This is kept for backward compatibility
    return { success: false, error: 'Please contact admin to create an account' }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('authToken')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userId')
      localStorage.removeItem('companyId')
      localStorage.removeItem('companyName')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userData')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

