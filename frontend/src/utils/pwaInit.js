import BaseUrl from '../api/baseUrl.js'

// Base URL for API calls
const getApiBaseUrl = () => {
    // In development, use empty string to leverage Vite proxy
    // In production, use environment variable or default
    if (import.meta.env?.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL
    }
    // Development mode - use empty string for Vite proxy
    if (import.meta.env?.MODE === 'development' || import.meta.env?.DEV) {
        return ''
    }
    // Production fallback
    return BaseUrl
};

// Check if service workers are supported
const isServiceWorkerSupported = () => {
    return 'serviceWorker' in navigator;
};

// Fetch PWA settings from API
const fetchPwaSettings = async () => {
    try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/v1/pwa`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch PWA settings');
        }

        const data = await response.json();
        return data.success ? data.data : null;
    } catch (error) {
        console.warn('[PWA] Could not fetch PWA settings:', error.message);
        // Return default settings on error
        return {
            enabled: true,
            app_name: 'Develo CRM',
            short_name: 'CRM',
            theme_color: '#6366f1',
            background_color: '#ffffff'
        };
    }
};

// Update theme color meta tag
const updateThemeColor = (color) => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);
    console.log('[PWA] Theme color updated to:', color);
};

// Update Apple meta tags
const updateAppleMeta = (settings) => {
    // Apple mobile web app capable
    let metaAppleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!metaAppleCapable) {
        metaAppleCapable = document.createElement('meta');
        metaAppleCapable.name = 'apple-mobile-web-app-capable';
        document.head.appendChild(metaAppleCapable);
    }
    metaAppleCapable.setAttribute('content', 'yes');

    // Apple mobile web app status bar style
    let metaAppleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaAppleStatusBar) {
        metaAppleStatusBar = document.createElement('meta');
        metaAppleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
        document.head.appendChild(metaAppleStatusBar);
    }
    metaAppleStatusBar.setAttribute('content', 'default');

    // Apple mobile web app title
    let metaAppleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!metaAppleTitle) {
        metaAppleTitle = document.createElement('meta');
        metaAppleTitle.name = 'apple-mobile-web-app-title';
        document.head.appendChild(metaAppleTitle);
    }
    metaAppleTitle.setAttribute('content', settings.short_name || settings.app_name || 'CRM');
};

// Register service worker
const registerServiceWorker = async () => {
    if (!isServiceWorkerSupported()) {
        console.log('[PWA] Service workers not supported');
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });

        console.log('[PWA] Service Worker registered successfully');
        console.log('[PWA] Scope:', registration.scope);

        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[PWA] New service worker installing...');

            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[PWA] New content available! Refresh to update.');
                    }
                });
            }
        });

        return true;
    } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
        return false;
    }
};

// Unregister service worker
const unregisterServiceWorker = async () => {
    if (!isServiceWorkerSupported()) {
        return false;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
            console.log('[PWA] Service Worker unregistered');
        }
        return true;
    } catch (error) {
        console.error('[PWA] Service Worker unregistration failed:', error);
        return false;
    }
};

// Main PWA initialization function
export const initPwa = async () => {
    console.log('[PWA] Initializing PWA...');

    try {
        // Fetch PWA settings
        const settings = await fetchPwaSettings();

        if (!settings) {
            console.log('[PWA] No settings found, using defaults');
        }

        const isEnabled = settings?.enabled || settings?.enabled === 1;
        console.log('[PWA] PWA enabled:', isEnabled);

        if (isEnabled) {
            // Update theme color
            if (settings?.theme_color) {
                updateThemeColor(settings.theme_color);
            }

            // Update Apple meta tags
            updateAppleMeta(settings || {});

            // Register service worker
            const registered = await registerServiceWorker();

            if (registered) {
                console.log('[PWA] ✅ PWA fully initialized and ready for installation');
            }
        } else {
            // PWA is disabled
            console.log('[PWA] PWA is disabled in settings');
            await unregisterServiceWorker();
        }
    } catch (error) {
        console.error('[PWA] Initialization error:', error);
    }
};

// Check if app is running as installed PWA
export const isPwaInstalled = () => {
    // Check standalone mode (Android/Desktop)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }

    // Check iOS standalone
    if (window.navigator.standalone === true) {
        return true;
    }

    return false;
};

// Install prompt handling
let deferredPrompt = null;

// Listen for beforeinstallprompt event
if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('[PWA] 📱 Install prompt available!');
        e.preventDefault();
        deferredPrompt = e;

        // Dispatch custom event so UI can show install button
        window.dispatchEvent(new CustomEvent('pwa-install-available', { detail: e }));
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] 🎉 App installed successfully!');
        deferredPrompt = null;
        window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
}

// Check if install prompt is available
export const canInstallPwa = () => {
    return deferredPrompt !== null;
};

// Show install prompt
export const promptPwaInstall = async () => {
    if (!deferredPrompt) {
        console.log('[PWA] No install prompt available');
        return false;
    }

    console.log('[PWA] Showing install prompt...');
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);

    deferredPrompt = null;
    return outcome === 'accepted';
};

export default {
    initPwa,
    isPwaInstalled,
    canInstallPwa,
    promptPwaInstall
};
