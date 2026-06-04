import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

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
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [lastVoiceCommand, setLastVoiceCommand] = useState('')
  const [voiceMessage, setVoiceMessage] = useState('')
  const commandHandlersRef = useRef([])
  const voiceEnabledRef = useRef(false)
  const recognitionRef = useRef(null)

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
  const speakMessage = useCallback((text) => {
    setVoiceMessage(text)
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    utterance.lang = 'en-US'

    window.speechSynthesis.speak(utterance)
  }, [])

  const normalizeCommand = useCallback((command) => {
    return command
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }, [])

  const runVoiceCommand = useCallback((rawCommand) => {
    const command = normalizeCommand(rawCommand)

    if (!command) return

    setLastVoiceCommand(command)

    const matchedCommand = commandHandlersRef.current.find(({ phrases }) =>
      phrases.some((phrase) => command.includes(normalizeCommand(phrase)))
    )

    if (!matchedCommand) {
      speakMessage(`Voice command not found: ${command}`)
      return
    }

    matchedCommand.action(command)
    speakMessage(matchedCommand.feedback || 'Voice command completed')
  }, [normalizeCommand, speakMessage])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onstart = () => setIsListening(true)
      rec.onend = () => {
        setIsListening(false)
        if (voiceEnabledRef.current) {
          try {
            rec.start()
          } catch (error) {
            setIsListening(false)
          }
        }
      }
      rec.onerror = () => setIsListening(false)
      rec.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
        runVoiceCommand(transcript)
      }

      recognitionRef.current = rec
      setRecognition(rec)
      setVoiceSupported(true)
    }
  }, [runVoiceCommand])

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

  const registerVoiceCommands = useCallback((commands) => {
    const preparedCommands = commands.map((command) => ({
      ...command,
      phrases: command.phrases || []
    }))

    commandHandlersRef.current = preparedCommands
  }, [])

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
    if (!voiceSupported || !recognitionRef.current) {
      speakMessage('Voice commands are not supported in this browser')
      return
    }

    setVoiceEnabled(prev => {
      const nextValue = !prev
      voiceEnabledRef.current = nextValue

      try {
        if (nextValue) {
          recognitionRef.current.start()
          speakMessage('Voice commands enabled')
        } else {
          recognitionRef.current.stop()
          speakMessage('Voice commands disabled')
        }
      } catch (error) {
        setIsListening(false)
      }

      return nextValue
    })
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
    voiceSupported,
    isListening,
    lastVoiceCommand,
    voiceMessage,
    speak,
    runVoiceCommand,
    startListening,
    stopListening,
    registerVoiceCommands,
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
