// Main App Component with Global Context Providers
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import { ModulesProvider } from './context/ModulesContext.jsx'
import { PermissionsProvider } from './context/PermissionsContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
// import PwaInstallPrompt from './components/ui/PwaInstallPrompt.jsx'
// import './styles/google-translate-hide.css'

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
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
