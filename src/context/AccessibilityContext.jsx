import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AccessibilityContext = createContext()

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

export const AccessibilityProvider = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [isListening, setIsListening] = useState(false)

  // Initialize speech synthesis
  const speak = useCallback((text) => {
    if (!speechEnabled || !window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    utterance.lang = 'en-US'

    window.speechSynthesis.speak(utterance)
  }, [speechEnabled])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onstart = () => setIsListening(true)
      rec.onend = () => setIsListening(false)
      rec.onerror = () => setIsListening(false)

      setRecognition(rec)
    }
  }, [])

  const startListening = useCallback((onResult) => {
    if (recognition && voiceEnabled) {
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        onResult(transcript)
      }
      recognition.start()
    }
  }, [recognition, voiceEnabled])

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop()
    }
  }, [recognition])

  // Toggle functions
  const toggleHighContrast = () => {
    setHighContrast(prev => {
      const newValue = !prev
      if (newValue) {
        document.documentElement.classList.add('high-contrast')
      } else {
        document.documentElement.classList.remove('high-contrast')
      }
      return newValue
    })
  }

  const toggleLargeText = () => {
    setLargeText(prev => {
      const newValue = !prev
      if (newValue) {
        document.documentElement.classList.add('large-text')
      } else {
        document.documentElement.classList.remove('large-text')
      }
      return newValue
    })
  }

  const toggleSpeech = () => {
    setSpeechEnabled(prev => !prev)
  }

  const toggleVoice = () => {
    setVoiceEnabled(prev => !prev)
  }

  // Keyboard navigation helper
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + H for high contrast
      if (e.altKey && e.key === 'h') {
        e.preventDefault()
        toggleHighContrast()
      }
      // Alt + L for large text
      if (e.altKey && e.key === 'l') {
        e.preventDefault()
        toggleLargeText()
      }
      // Alt + S for speech
      if (e.altKey && e.key === 's') {
        e.preventDefault()
        toggleSpeech()
      }
      // Alt + V for voice
      if (e.altKey && e.key === 'v') {
        e.preventDefault()
        toggleVoice()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const value = {
    highContrast,
    largeText,
    speechEnabled,
    voiceEnabled,
    isListening,
    speak,
    startListening,
    stopListening,
    toggleHighContrast,
    toggleLargeText,
    toggleSpeech,
    toggleVoice
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}
