/**
 * Base URL Configuration
 * API base URL for all backend requests
 */

// Use environment variable if available, otherwise use localhost:8000
const BaseUrl = 
  import.meta.env.VITE_API_BASE_URL || 
  import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 
  'http://localhost:8010'

export default BaseUrl