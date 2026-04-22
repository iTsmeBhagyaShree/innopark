import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize PWA
import { initPwa } from './utils/pwaInit.js'

// Initialize PWA after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPwa)
} else {
  initPwa()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.Fragment>
    <App />
  </React.Fragment>,
)
