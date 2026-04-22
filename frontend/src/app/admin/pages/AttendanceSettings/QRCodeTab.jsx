/**
 * QR Code Tab
 * QR Code for Attendance
 */

import { useState } from 'react'
import { useTheme } from '../../../../context/ThemeContext'
import { IoCopy, IoDownload, IoPrint } from 'react-icons/io5'
import { toast } from 'react-hot-toast'

const QRCodeTab = () => {
  const { theme } = useTheme()
  const isDark = theme.mode === 'dark'
  
  const [qrEnabled, setQrEnabled] = useState(true)
  const qrUrl = 'https://demo.worksuite.biz/account/check-qr-login/3604b73010ebc4df04ef9e3f'

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl)
    toast.success('URL copied to clipboard!')
  }

  const handleDownload = () => {
    toast.success('QR Code downloaded!')
  }

  const handlePrint = () => {
    window.print()
    toast.success('Printing QR Code...')
  }

  return (
    <div className="space-y-6">
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
          QR Code
        </h3>

        {/* Toggle */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setQrEnabled(!qrEnabled)}
            className={`relative inline-flex items-center h-7 rounded-full w-14 transition-colors focus:outline-none ${
              qrEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block w-5 h-5 transform transition-transform bg-white rounded-full ${
                qrEnabled ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span style={{ color: isDark ? '#E5E7EB' : '#6B7280' }}>
            {qrEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {qrEnabled && (
          <>
            {/* QR URL */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrUrl}
                  readOnly
                  className="flex-1 px-4 py-2.5 rounded border outline-none"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    color: isDark ? '#E5E7EB' : '#1F2937',
                  }}
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 rounded transition-colors flex items-center gap-2"
                  style={{ color: isDark ? '#1F2937' : '#374151' }}
                >
                  <IoCopy size={18} />
                </button>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center gap-6 py-8">
              <div 
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: isDark ? '#111827' : '#ffffff',
                  border: `2px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                }}
              >
                {/* QR Code placeholder - In production, use a QR code library */}
                <div className="w-64 h-64 bg-white flex items-center justify-center">
                  <svg width="256" height="256" viewBox="0 0 256 256">
                    {/* QR Code pattern - simplified representation */}
                    <rect width="256" height="256" fill="white"/>
                    {Array.from({ length: 16 }).map((_, i) =>
                      Array.from({ length: 16 }).map((_, j) => (
                        <rect
                          key={`${i}-${j}`}
                          x={j * 16}
                          y={i * 16}
                          width="16"
                          height="16"
                          fill={Math.random() > 0.5 ? 'black' : 'white'}
                        />
                      ))
                    )}
                  </svg>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <IoDownload size={18} />
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-2.5 border rounded hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    color: isDark ? '#E5E7EB' : '#374151',
                  }}
                >
                  <IoPrint size={18} />
                  Print
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default QRCodeTab

