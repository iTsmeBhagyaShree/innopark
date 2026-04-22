import { useState, useEffect, useRef } from 'react'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import axiosInstance from '../../../api/axiosInstance'
import { IoPhonePortrait, IoColorPalette, IoImage, IoCheckmarkCircle, IoCloudUpload, IoRefresh } from 'react-icons/io5'
import BaseUrl from '../../../api/baseUrl'
import ColorPicker from '../../../components/ui/ColorPicker'
import { useLanguage } from '../../../context/LanguageContext'

const PwaSettings = () => {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [iconPreview, setIconPreview] = useState(null)
    const [iconFile, setIconFile] = useState(null)
    const fileInputRef = useRef(null)

    const [formData, setFormData] = useState({
        enabled: false,
        app_name: 'Develo CRM',
        short_name: 'CRM',
        description: 'A powerful CRM solution for your business',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        icon_url: null
    })

    useEffect(() => {
        fetchPwaSettings()
    }, [])

    const fetchPwaSettings = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/pwa')
            if (response.data.success) {
                setFormData(response.data.data)
                if (response.data.data.icon_url) {
                    const iconUrl = response.data.data.icon_url.startsWith('http')
                        ? response.data.data.icon_url
                        : `${BaseUrl}${response.data.data.icon_url}`
                    setIconPreview(iconUrl)
                }
            }
        } catch (error) {
            console.error('Error fetching PWA settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleIconChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                alert(t('alerts.invalid_image') || 'Please upload a PNG, JPEG, or WebP image')
                return
            }

            if (file.size > 2 * 1024 * 1024) {
                alert(t('alerts.file_too_large') || t('settings.alerts.file_too_large'))
                return
            }

            setIconFile(file)

            const reader = new FileReader()
            reader.onloadend = () => {
                setIconPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            if (!formData.app_name || formData.app_name.trim() === '') {
                alert(t('alerts.app_name_required') || 'App name is required')
                return
            }
            if (!formData.short_name || formData.short_name.trim() === '') {
                alert(t('alerts.short_name_required') || 'Short name is required')
                return
            }

            const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
            if (!hexRegex.test(formData.theme_color)) {
                alert(t('alerts.invalid_hex_theme') || 'Theme color must be a valid HEX color')
                return
            }
            if (!hexRegex.test(formData.background_color)) {
                alert(t('alerts.invalid_hex_bg') || 'Background color must be a valid HEX color')
                return
            }

            let response

            if (iconFile) {
                const formDataToSend = new FormData()
                formDataToSend.append('enabled', formData.enabled ? '1' : '0')
                formDataToSend.append('app_name', formData.app_name)
                formDataToSend.append('short_name', formData.short_name)
                formDataToSend.append('description', formData.description || '')
                formDataToSend.append('theme_color', formData.theme_color)
                formDataToSend.append('background_color', formData.background_color)
                formDataToSend.append('icon', iconFile)

                response = await axiosInstance.put('/pwa', formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
            } else {
                response = await axiosInstance.put('/pwa', formData)
            }

            if (response.data.success) {
                alert(t('alerts.save_success') || 'PWA settings saved successfully!')
                setIconFile(null)
                fetchPwaSettings()

                updateThemeColor(formData.theme_color)
            }
        } catch (error) {
            console.error('Error saving PWA settings:', error)
            alert(error.response?.data?.error || t('alerts.save_failed') || 'Could not save PWA settings')
        } finally {
            setSaving(false)
        }
    }

    const updateThemeColor = (color) => {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', color)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto"></div>
                    <p className="mt-4 text-secondary-text">{t('loading')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary-text">{t('pwa.title')}</h1>
                    <p className="text-secondary-text mt-1">{t('pwa.subtitle')}</p>
                </div>
            </div>

            {/* PWA Status Card */}
            <Card className="p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${formData.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <IoPhonePortrait size={24} className={formData.enabled ? 'text-green-600' : 'text-gray-400'} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-primary-text">{t('common.status')}</h2>
                            <p className="text-sm text-secondary-text">
                                {formData.enabled
                                    ? t('pwa.status_enabled')
                                    : t('pwa.status_disabled')}
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.enabled}
                            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
            </Card>

            {/* App Identity */}
            <Card className="p-5">
                <h2 className="text-lg font-semibold text-primary-text mb-4 flex items-center gap-2">
                    <IoPhonePortrait size={20} />
                    {t('pwa.app_identity')}
                </h2>
                <div className="space-y-4">
                    <Input
                        label={`${t('pwa.app_name')} *`}
                        value={formData.app_name}
                        onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                    />

                    <Input
                        label={`${t('pwa.short_name')} *`}
                        value={formData.short_name}
                        onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    />

                    <div>
                        <label className="block text-sm font-medium text-primary-text mb-2">{t('pwa.description')}</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                            placeholder={t('pwa.description_placeholder')}
                        />
                        <p className="text-xs text-secondary-text mt-1">{t('pwa.description_helper')}</p>
                    </div>
                </div>
            </Card>

            {/* App Appearance */}
            <Card className="p-5">
                <h2 className="text-lg font-semibold text-primary-text mb-4 flex items-center gap-2">
                    <IoColorPalette size={20} />
                    {t('pwa.app_appearance')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-primary-text mb-2">{t('pwa.theme_color')} *</label>
                        <div className="flex items-center gap-3">
                            <ColorPicker
                                value={formData.theme_color}
                                onChange={(color) => setFormData({ ...formData, theme_color: color })}
                            />
                            <input
                                type="text"
                                value={formData.theme_color}
                                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white uppercase"
                                placeholder="#6366f1"
                                maxLength={7}
                            />
                        </div>
                        <p className="text-xs text-secondary-text mt-1">{t('pwa.theme_color_helper')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-primary-text mb-2">{t('pwa.background_color')} *</label>
                        <div className="flex items-center gap-3">
                            <ColorPicker
                                value={formData.background_color}
                                onChange={(color) => setFormData({ ...formData, background_color: color })}
                            />
                            <input
                                type="text"
                                value={formData.background_color}
                                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white uppercase"
                                placeholder="#ffffff"
                                maxLength={7}
                            />
                        </div>
                        <p className="text-xs text-secondary-text mt-1">{t('pwa.background_color_helper')}</p>
                    </div>
                </div>
            </Card>

            {/* App Icon */}
            <Card className="p-5">
                <h2 className="text-lg font-semibold text-primary-text mb-4 flex items-center gap-2">
                    <IoImage size={20} />
                    {t('pwa.app_icon')}
                </h2>
                <div className="flex items-start gap-6">
                    {/* Icon Preview */}
                    <div className="flex-shrink-0">
                        <div
                            className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: formData.background_color }}
                        >
                            {iconPreview ? (
                                <img
                                    src={iconPreview}
                                    alt="PWA-Icon-Vorschau"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <IoImage size={32} className="text-gray-400" />
                            )}
                        </div>
                        <p className="text-xs text-center text-secondary-text mt-2">192×192 px</p>
                    </div>

                    {/* Upload Section */}
                    <div className="flex-1">
                        <p className="text-sm text-secondary-text mb-3">
                            {t('pwa.icon_helper')}
                        </p>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleIconChange}
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2"
                            >
                                <IoCloudUpload size={18} />
                                {t('pwa.upload_icon')}
                            </Button>
                            {iconPreview && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIconPreview(null)
                                        setIconFile(null)
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = ''
                                        }
                                    }}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    {t('remove')}
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-secondary-text mt-2">{t('pwa.icon_formats_helper')}</p>
                    </div>
                </div>
            </Card>

            {/* PWA Preview */}
            <Card className="p-5">
                <h2 className="text-lg font-semibold text-primary-text mb-4 flex items-center gap-2">
                    <IoCheckmarkCircle size={20} />
                    {t('pwa.installation_preview')}
                </h2>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                    <div className="max-w-sm mx-auto">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden border-4 border-gray-300 dark:border-gray-600">
                            <div
                                className="h-8 flex items-center justify-center"
                                style={{ backgroundColor: formData.theme_color }}
                            >
                                <span className="text-white text-xs font-medium">9:41</span>
                            </div>

                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                                        style={{ backgroundColor: formData.background_color }}
                                    >
                                        {iconPreview ? (
                                            <img src={iconPreview} alt="Icon" className="w-full h-full object-cover" />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                                                style={{ backgroundColor: formData.theme_color }}
                                            >
                                                {formData.short_name?.charAt(0) || 'C'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{formData.app_name || 'Develo CRM'}</h3>
                                        <p className="text-xs text-gray-500">{formData.short_name || 'CRM'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {formData.description || 'A powerful CRM solution for your business'}
                                </p>
                                <button
                                    className="w-full mt-4 py-2 rounded-lg text-white font-medium"
                                    style={{ backgroundColor: formData.theme_color }}
                                >
                                    {t('pwa.install_app')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-xs text-secondary-text mt-4">
                        {t('pwa.preview_helper')}
                    </p>
                </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={fetchPwaSettings}
                    className="flex items-center gap-2"
                >
                    <IoRefresh size={18} />
                    {t('pwa.reset')}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-primary-accent text-white hover:bg-primary-accent/90 flex items-center gap-2"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            {t('common.saving')}
                        </>
                    ) : (
                        <>
                            <IoCheckmarkCircle size={18} />
                            {t('common.save')}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

export default PwaSettings
