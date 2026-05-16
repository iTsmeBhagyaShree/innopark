// Main App Component with Global Context Providers
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { SettingsProvider } from './context/SettingsContext'
import { ModulesProvider } from './context/ModulesContext'
import { PermissionsProvider } from './context/PermissionsContext'
import AppRoutes from './routes/AppRoutes'
// import PwaInstallPrompt from './components/ui/PwaInstallPrompt.jsx'
// import './styles/google-translate-hide.css'

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        {/* Inside SettingsProvider so UI language can follow company default_language when SYNC_COMPANY_DEFAULT_LANGUAGE is true */}
        <LanguageProvider>
          <ThemeProvider>
            <ModulesProvider>
              <PermissionsProvider>
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <AppRoutes />
                  <Toaster position="top-right" />
                  {/* PWA Install Prompt - disabled to prevent popup */}
                  {/* <PwaInstallPrompt /> */}
                </BrowserRouter>
              </PermissionsProvider>
            </ModulesProvider>
          </ThemeProvider>
        </LanguageProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
