import React from 'react'
import { Eye, Type, Mic, Volume2, X } from 'lucide-react'
import { useAccessibility } from '../../context/AccessibilityContext'

const AccessibilityPanel = ({ isOpen, onClose }) => {
  const { 
    highContrast, 
    largeText, 
    speechEnabled, 
    voiceEnabled, 
    voiceSupported,
    isListening,
    lastVoiceCommand,
    voiceMessage,
    toggleHighContrast, 
    toggleLargeText, 
    toggleSpeech, 
    toggleVoice 
  } = useAccessibility()

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Accessibility</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100"
          aria-label="Close accessibility panel"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-3">
        <button
          onClick={toggleHighContrast}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            highContrast ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-pressed={highContrast}
        >
          <Eye className="w-5 h-5" />
          <span className="font-medium">High Contrast</span>
          <span className="ml-auto text-xs opacity-75">Alt+H</span>
        </button>

        <button
          onClick={toggleLargeText}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            largeText ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-pressed={largeText}
        >
          <Type className="w-5 h-5" />
          <span className="font-medium">Large Text</span>
          <span className="ml-auto text-xs opacity-75">Alt+L</span>
        </button>

        <button
          onClick={toggleSpeech}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            speechEnabled ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-pressed={speechEnabled}
        >
          <Volume2 className="w-5 h-5" />
          <span className="font-medium">Text to Speech</span>
          <span className="ml-auto text-xs opacity-75">Alt+S</span>
        </button>

        <button
          onClick={toggleVoice}
          disabled={!voiceSupported}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            voiceEnabled
              ? 'bg-primary-600 text-white'
              : voiceSupported
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
          aria-pressed={voiceEnabled}
        >
          <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
          <span className="font-medium">Voice Commands</span>
          <span className="ml-auto text-xs opacity-75">Alt+V</span>
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {voiceMessage || 'Use keyboard shortcuts for quick access'}
        </p>
        {lastVoiceCommand && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Last command: {lastVoiceCommand}
          </p>
        )}
      </div>
    </div>
  )
}

export default AccessibilityPanel
