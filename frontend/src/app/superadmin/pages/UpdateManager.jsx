import { useState, useEffect } from 'react'
import {
    IoRefresh,
    IoCloudDownload,
    IoShieldCheckmark,
    IoTime,
    IoSave,
    IoTerminal,
    IoCheckmarkCircle,
    IoAlertCircle,
    IoServer
} from 'react-icons/io5'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useLanguage } from '../../../context/LanguageContext'
import axiosInstance from '../../../api/axiosInstance'

const UpdateManager = () => {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [systemInfo, setSystemInfo] = useState({
        current_version: '1.0.4',
        last_checked: new Date().toISOString(),
        php_version: '8.2.12',
        server_os: 'Linux / Ubuntu',
        database_version: 'MySQL 8.0.35'
    })
    const [availableUpdate, setAvailableUpdate] = useState(null)
    const [updateLogs, setUpdateLogs] = useState([])

    useEffect(() => {
        // Mock fetching system info
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
        }, 1000)
    }, [])

    const checkUpdates = async () => {
        setChecking(true)
        setUpdateLogs(prev => [...prev, 'Checking for updates...'])
        
        // Mock API call
        setTimeout(() => {
            setChecking(false)
            setAvailableUpdate({
                version: '1.0.5',
                release_date: '2024-05-15',
                changes: [
                    'Improved performance for CRM dashboard',
                    'Fixed custom field persistence bug',
                    'Added module toggling functionality',
                    'Enhanced security for super admin access'
                ]
            })
            setUpdateLogs(prev => [...prev, 'Update available: Version 1.0.5'])
        }, 2000)
    }

    const runUpdate = async () => {
        if (!availableUpdate) return
        if (!window.confirm(`Start update to version ${availableUpdate.version}? Please ensure you have a database backup.`)) return

        setUpdating(true)
        setUpdateLogs(prev => [...prev, `Starting update to ${availableUpdate.version}...`])

        // Mock update process
        const steps = [
            'Downloading update package...',
            'Extracting files...',
            'Updating database schema...',
            'Cleaning cache...',
            'Finalizing update...'
        ]

        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500))
            setUpdateLogs(prev => [...prev, steps[i]])
        }

        setUpdating(false)
        setSystemInfo(prev => ({ ...prev, current_version: availableUpdate.version }))
        setAvailableUpdate(null)
        setUpdateLogs(prev => [...prev, 'Update completed successfully!'])
    }

    return (
        <div className="space-y-6 p-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <IoRefresh className="text-primary-accent" /> {t('sidebar.updates') || 'Update Manager'}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Manage system updates and check server status</p>
                </div>
                <Button 
                    onClick={checkUpdates} 
                    disabled={checking || updating}
                    className="flex items-center gap-2"
                >
                    <IoCloudDownload size={18} />
                    {checking ? 'Checking...' : 'Check for Updates'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Info */}
                <Card className="lg:col-span-1 p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 border-b pb-4 flex items-center gap-2">
                        <IoServer className="text-primary-accent" /> System Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-500">Current Version</span>
                            <Badge variant="success" className="font-bold">{systemInfo.current_version}</Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-500">PHP Version</span>
                            <span className="text-sm font-bold text-gray-900">{systemInfo.php_version}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-500">Database</span>
                            <span className="text-sm font-bold text-gray-900">{systemInfo.database_version}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-500">Server OS</span>
                            <span className="text-sm font-bold text-gray-900">{systemInfo.server_os}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-500">Last Checked</span>
                            <span className="text-sm text-gray-900 flex items-center gap-1">
                                <IoTime size={14} className="text-gray-400" />
                                {new Date(systemInfo.last_checked).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Update Available / Status */}
                <div className="lg:col-span-2 space-y-6">
                    {availableUpdate ? (
                        <Card className="p-6 border-2 border-primary-accent bg-primary-accent/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="warning" className="animate-pulse">New Version Available</Badge>
                                        <h2 className="text-xl font-black text-gray-900">v{availableUpdate.version}</h2>
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">Released on {availableUpdate.release_date}</p>
                                    <div className="mt-4">
                                        <p className="text-sm font-bold text-gray-900 mb-2">Changelog:</p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                            {availableUpdate.changes.map((change, i) => (
                                                <li key={i}>{change}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Button 
                                        onClick={runUpdate} 
                                        disabled={updating}
                                        className="w-full py-4 px-8 text-lg shadow-lg shadow-primary-accent/20"
                                    >
                                        {updating ? 'Updating...' : 'Install Now'}
                                    </Button>
                                    <p className="text-[10px] text-gray-400 text-center">
                                        System will be temporarily unavailable during update.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="p-10 flex flex-col items-center justify-center text-center border-dashed border-2">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <IoShieldCheckmark size={32} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Your system is up to date!</h2>
                            <p className="text-sm text-gray-500 mt-2 max-w-xs">
                                No updates found at this time. Your system is running version {systemInfo.current_version}.
                            </p>
                        </Card>
                    )}

                    {/* Terminal Logs */}
                    <Card className="bg-gray-900 p-0 overflow-hidden rounded-xl">
                        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400">
                                <IoTerminal size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Update Console</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                            </div>
                        </div>
                        <div className="p-4 h-64 overflow-y-auto font-mono text-xs text-green-400 custom-scrollbar bg-black/50">
                            {updateLogs.length === 0 ? (
                                <span className="text-gray-600 italic">No logs available. Check for updates to start...</span>
                            ) : (
                                <div className="space-y-1">
                                    {updateLogs.map((log, i) => (
                                        <div key={i} className="flex gap-2">
                                            <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                                            <span className={log.includes('successfully') || log.includes('available') ? 'text-green-400 font-bold' : ''}>
                                                {log.startsWith('Starting') || log.startsWith('Finalizing') ? '> ' : ''}
                                                {log}
                                            </span>
                                        </div>
                                    ))}
                                    {updating && (
                                        <div className="animate-pulse">_</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default UpdateManager
