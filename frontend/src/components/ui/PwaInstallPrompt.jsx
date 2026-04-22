import { useState, useEffect } from 'react'
import { IoClose, IoCloudDownload, IoPhonePortrait } from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'
import axiosInstance from '../../api/axiosInstance'
import BaseUrl from '../../api/baseUrl'

const PwaInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [settings, setSettings] = useState(null)

    useEffect(() => {
        // 1. Fetch PWA Settings to see if enabled
        const checkPwaSettings = async () => {
            try {
                const response = await axiosInstance.get('/pwa')
                if (response.data.success) {
                    setSettings(response.data.data)
                }
            } catch (error) {
                console.error('Failed to fetch PWA settings', error)
            }
        }
        checkPwaSettings()

        // 2. Listen for beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Only show if PWA is enabled in settings (default to true if fetch fails/not loaded yet?)
            // We'll wait for settings to load properly
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // 3. Check if we should show prompt based on localStorage (don't show if dismissed recently)
        const lastDismissed = localStorage.getItem('pwa_prompt_dismissed')
        if (lastDismissed) {
            const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
            if (daysSinceDismissed < 1) { // Wait 1 day before showing again
                return
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    useEffect(() => {
        if (settings?.enabled && deferredPrompt) {
            // Delay slightly for better UX
            const timer = setTimeout(() => setShowPrompt(true), 3000)
            return () => clearTimeout(timer)
        }
    }, [settings, deferredPrompt])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setShowPrompt(false)
            setDeferredPrompt(null)
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString())
    }

    if (!showPrompt || !settings) return null

    // Use settings for customization
    const iconUrl = settings.icon_url
        ? (settings.icon_url.startsWith('http') ? settings.icon_url : `${BaseUrl}${settings.icon_url}`)
        : null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 max-w-sm w-full"
            >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-premium p-4 md:p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    {/* Background accent */}
                    <div
                        className="absolute top-0 left-0 w-full h-1"
                        style={{ backgroundColor: settings.theme_color || '#6366f1' }}
                    />

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
                    >
                        <IoClose size={20} />
                    </button>

                    <div className="flex items-start gap-4">
                        {/* App Icon */}
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: settings.background_color || '#ffffff' }}
                        >
                            {iconUrl ? (
                                <img src={iconUrl} alt="App Icon" className="w-full h-full object-cover" />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                                    style={{ backgroundColor: settings.theme_color || '#6366f1' }}
                                >
                                    {settings.short_name?.charAt(0) || 'C'}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 pt-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                Install {settings.app_name || 'Develo CRM'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                                {settings.description || 'Add to home screen for quick access and better experience.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Not now
                        </button>
                        <button
                            onClick={handleInstallClick}
                            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            style={{ backgroundColor: settings.theme_color || '#6366f1' }}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <IoCloudDownload size={18} />
                                Install App
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

export default PwaInstallPrompt
