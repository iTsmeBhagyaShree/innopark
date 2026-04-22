import { useState, useEffect, useRef } from 'react'
import { IoPlay, IoStop, IoPause } from 'react-icons/io5'

const Timer = ({ onStart, onStop, onSave, projectId, taskId, initialTime = 0 }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(initialTime) // in seconds
  const [startTime, setStartTime] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const now = Date.now()
          const elapsed = Math.floor((now - startTime) / 1000)
          return elapsed
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, startTime])

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleStart = () => {
    const now = Date.now()
    setStartTime(now)
    setIsRunning(true)
    if (onStart) {
      onStart({ projectId, taskId, startTime: now })
    }
  }

  const handleStop = () => {
    setIsRunning(false)
    const hours = (elapsedTime / 3600).toFixed(2)
    if (onStop) {
      onStop({ projectId, taskId, elapsedTime, hours: parseFloat(hours) })
    }
    if (onSave && elapsedTime > 0) {
      onSave({ projectId, taskId, hours: parseFloat(hours), elapsedTime })
    }
    setElapsedTime(0)
    setStartTime(null)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleResume = () => {
    if (startTime) {
      const pausedTime = elapsedTime
      const now = Date.now()
      const newStartTime = now - (pausedTime * 1000)
      setStartTime(newStartTime)
      setIsRunning(true)
    } else {
      handleStart()
    }
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <div className="flex-1">
        <div className="text-xs text-secondary-text mb-1">Elapsed Time</div>
        <div className="text-2xl font-mono font-bold text-primary-text">
          {formatTime(elapsedTime)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 transition-colors font-medium"
          >
            <IoPlay size={18} />
            <span>Start</span>
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              <IoPause size={18} />
              <span>Pause</span>
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <IoStop size={18} />
              <span>Stop</span>
            </button>
          </>
        )}
        {!isRunning && elapsedTime > 0 && (
          <button
            onClick={handleResume}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <IoPlay size={18} />
            <span>Resume</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default Timer

