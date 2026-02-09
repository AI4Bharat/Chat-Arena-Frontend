import * as React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import { setCaretPosition, getInputSelection } from "../utils/transliterate-utils"
import getCaretCoordinates from "textarea-caret"

const KEY_UP = "ArrowUp"
const KEY_DOWN = "ArrowDown"
const KEY_LEFT = "ArrowLeft"
const KEY_RIGHT = "ArrowRight"
const KEY_ESCAPE = "Escape"
const OPTION_LIST_Y_OFFSET = 10
const OPTION_LIST_MIN_WIDTH = 100

// Trigger Keys Constants - MOVED TO TOP
export const TriggerKeys = {
  KEY_RETURN: "Enter",
  KEY_ENTER: "Enter",
  KEY_TAB: "Tab",
  KEY_SPACE: " "
}

// Language code mapping - Updated for Thai and Indonesian
const LANGUAGE_MAP = {
  'th': 'th-t-i0-und',  // Thai - Google Input Tools format
  'id': 'id',           // Indonesian - not supported by Google, will fallback
  'hi': 'hi-t-i0-und',
  'mr': 'mr-t-i0-und',
  'ta': 'ta-t-i0-und',
  'te': 'te-t-i0-und',
  'kn': 'kn-t-i0-und',
  'gu': 'gu-t-i0-und',
  'bn': 'bn-t-i0-und',
  'ml': 'ml-t-i0-und',
}

// Languages that don't support transliteration (Latin script languages)
const NO_TRANSLITERATION_LANGS = ['id', 'en']

// Cache management
const MAX_CACHE_SIZE = 5000
const transliterationCache = {}

function loadCacheFromLocalStorage() {
  if (typeof window !== "undefined") {
    const cachedData = localStorage.getItem("googleTransliterationCache")
    return cachedData ? JSON.parse(cachedData) : {}
  }
  return {}
}

function saveCacheToLocalStorage(cache) {
  if (typeof window !== "undefined") {
    localStorage.setItem("googleTransliterationCache", JSON.stringify(cache))
  }
}

// Load cache on initialization
Object.assign(transliterationCache, loadCacheFromLocalStorage())

// Google Input Tools API function
export const getGoogleTransliterateSuggestions = async (
  word,
  lang,
  config = {}
) => {
  const { showCurrentWordAsLastSuggestion = true, maxOptions = 5 } = config
  
  // Check if language doesn't support transliteration
  if (NO_TRANSLITERATION_LANGS.includes(lang)) {
    return showCurrentWordAsLastSuggestion ? [word] : []
  }
  
  const googleLang = LANGUAGE_MAP[lang] || lang
  const cacheKey = `${googleLang}:${word.toLowerCase()}`

  // Check cache first
  if (transliterationCache[googleLang]?.[word.toLowerCase()]) {
    transliterationCache[googleLang][word.toLowerCase()].frequency += 1
    return transliterationCache[googleLang][word.toLowerCase()].suggestions
  }

  // Google Input Tools API URL
  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
    word
  )}&itc=${googleLang}&num=${maxOptions}&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data && data[0] === "SUCCESS" && data[1] && data[1][0] && data[1][0][1]) {
      const suggestions = data[1][0][1]
      const result = showCurrentWordAsLastSuggestion ? [...suggestions, word] : suggestions

      // Initialize language cache if not exists
      if (!transliterationCache[googleLang]) {
        transliterationCache[googleLang] = {}
      }

      // Cache management
      if (Object.keys(transliterationCache[googleLang]).length >= MAX_CACHE_SIZE) {
        const firstKey = Object.keys(transliterationCache[googleLang])[0]
        delete transliterationCache[googleLang][firstKey]
      }

      transliterationCache[googleLang][word.toLowerCase()] = {
        suggestions: result,
        frequency: 1
      }

      saveCacheToLocalStorage(transliterationCache)
      return result
    } else {
      return showCurrentWordAsLastSuggestion ? [word] : []
    }
  } catch (e) {
    console.error("Google transliteration error:", e)
    return showCurrentWordAsLastSuggestion ? [word] : []
  }
}

// Save cache on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    saveCacheToLocalStorage(transliterationCache)
  })
}

export const GoogleTransliterate = ({
  renderComponent = props => <input {...props} />,
  lang = "hi",
  offsetX = 0,
  offsetY = 10,
  onChange,
  onChangeText,
  onBlur,
  value,
  onKeyDown,
  containerClassName = "",
  containerStyles = {},
  activeItemStyles = {},
  maxOptions = 5,
  hideSuggestionBoxOnMobileDevices = false,
  hideSuggestionBoxBreakpoint = 640,
  triggerKeys = [
    TriggerKeys.KEY_SPACE,
    TriggerKeys.KEY_ENTER,
    TriggerKeys.KEY_RETURN,
    TriggerKeys.KEY_TAB
  ],
  insertCurrentSelectionOnBlur = true,
  showCurrentWordAsLastSuggestion = true,
  enabled = true,
  horizontalView = false,
  suggestionListClassName = "",
  suggestionItemClassName = "",
  activeSuggestionItemClassName = "",
  enableASR = false,
  asrApiUrl = "",
  apiKey = "",
  micButtonRef = null,
  onVoiceTypingStateChange = null,
  ...rest
}) => {
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const [selection, setSelection] = useState(0)
  const [matchStart, setMatchStart] = useState(-1)
  const [matchEnd, setMatchEnd] = useState(-1)
  const inputRef = useRef(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [options, setOptions] = useState([])

  // Check if current language supports transliteration
  const supportsTransliteration = !NO_TRANSLITERATION_LANGS.includes(lang)
  const effectivelyEnabled = enabled && supportsTransliteration

  const shouldRenderSuggestions = useMemo(
    () =>
      hideSuggestionBoxOnMobileDevices
        ? windowSize.width > hideSuggestionBoxBreakpoint
        : true,
    [windowSize, hideSuggestionBoxBreakpoint, hideSuggestionBoxOnMobileDevices]
  )

  const reset = () => {
    setSelection(0)
    setOptions([])
  }

  const handleSelection = index => {
    const currentString = value
    const newValue =
      currentString.substring(0, matchStart) +
      options[index] +
      " " +
      currentString.substring(matchEnd + 1, currentString.length)

    setTimeout(() => {
      setCaretPosition(inputRef.current, matchStart + options[index].length + 1)
    }, 1)

    const e = { target: { value: newValue } }
    onChangeText(newValue)
    onChange && onChange(e)
    reset()
    return inputRef.current?.focus()
  }

  const renderSuggestions = async (lastWord) => {
    if (!shouldRenderSuggestions || !effectivelyEnabled) {
      return
    }

    const data = await getGoogleTransliterateSuggestions(lastWord, lang, {
      showCurrentWordAsLastSuggestion,
      maxOptions
    })
    setOptions(data ?? [])
  }

  const handleChange = e => {
    const value = e.currentTarget.value
    onChange && onChange(e)
    onChangeText(value)

    if (!shouldRenderSuggestions || !effectivelyEnabled) {
      return
    }

    const caret = getInputSelection(e.target).end
    const input = inputRef.current
    if (!input) return

    const caretPos = getCaretCoordinates(input, caret)
    const indexOfLastSpace =
      value.lastIndexOf(" ", caret - 1) < value.lastIndexOf("\n", caret - 1)
        ? value.lastIndexOf("\n", caret - 1)
        : value.lastIndexOf(" ", caret - 1)

    setMatchStart(indexOfLastSpace + 1)
    setMatchEnd(caret - 1)

    const currentWord = value.slice(indexOfLastSpace + 1, caret)

    if (currentWord) {
      renderSuggestions(currentWord)

      const rect = input.getBoundingClientRect()
      const left = Math.min(
        caretPos.left,
        rect.width - OPTION_LIST_MIN_WIDTH / 2
      )
      const top = Math.min(caretPos.top + OPTION_LIST_Y_OFFSET, rect.height)

      setTop(top)
      setLeft(left)
    } else {
      reset()
    }
  }

  const handleKeyDown = event => {
    const helperVisible = options.length > 0

    if (helperVisible) {
      if (triggerKeys.includes(event.key)) {
        event.preventDefault()
        handleSelection(selection)
      } else {
        switch (event.key) {
          case KEY_ESCAPE:
            event.preventDefault()
            reset()
            break
          case KEY_UP:
            event.preventDefault()
            setSelection((options.length + selection - 1) % options.length)
            break
          case KEY_DOWN:
            event.preventDefault()
            setSelection((selection + 1) % options.length)
            break
          case KEY_LEFT:
            event.preventDefault()
            setSelection((options.length + selection - 1) % options.length)
            break
          case KEY_RIGHT:
            event.preventDefault()
            setSelection((selection + 1) % options.length)
            break
          default:
            onKeyDown && onKeyDown(event)
            break
        }
      }
    } else {
      onKeyDown && onKeyDown(event)
    }
  }

  const handleBlur = event => {
    reset()
    onBlur && onBlur(event)
  }

  const handleResize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    setWindowSize({ width, height })
  }

  useEffect(() => {
    window.addEventListener("resize", handleResize)
    const width = window.innerWidth
    const height = window.innerHeight
    setWindowSize({ width, height })

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Voice typing functionality
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const handleVoiceTyping = async () => {
    if (!navigator.mediaDevices) {
      alert("Browser doesn't support audio recording.")
      return
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      setIsLoading(true)
      onVoiceTypingStateChange?.('loading')
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = event => {
          audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          setIsLoading(true)
          onVoiceTypingStateChange?.('loading')

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          const base64Audio = await blobToBase64Raw(audioBlob)
          const transcript = await transcribeWithDhruva(asrApiUrl, lang, base64Audio)

          const target = inputRef.current
          if (target) {
            const cursorPos = target.selectionStart
            const currentText = value
            const newValue =
              currentText.slice(0, cursorPos) +
              transcript +
              currentText.slice(cursorPos)

            const e = { target: { value: newValue } }
            onChange?.(e)
            onChangeText(newValue)
          }

          setIsLoading(false)
          onVoiceTypingStateChange?.('idle')
        }

        mediaRecorder.start()
        setIsRecording(true)
        onVoiceTypingStateChange?.('recording')
      } catch (err) {
        console.error("Error accessing microphone:", err)
        setIsRecording(false)
        setIsLoading(false)
        onVoiceTypingStateChange?.('idle')
      }
    }
  }

  async function blobToBase64Raw(blob) {
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ""
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i])
    }
    return btoa(binary)
  }

  async function transcribeWithDhruva(apiURL, lang, base64Audio) {
    try {
      const response = await fetch(apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": apiKey
        },
        body: JSON.stringify({
          audioBase64: base64Audio,
          lang
        })
      })

      const result = await response.json()
      return result.transcript || ""
    } catch (err) {
      console.error("Transcription API error:", err)
      return ""
    }
  }

  useEffect(() => {
    if (enableASR && micButtonRef?.current) {
      const button = micButtonRef.current
      button.addEventListener('click', handleVoiceTyping)

      return () => {
        button.removeEventListener('click', handleVoiceTyping)
        if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop()
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        }
      }
    }
  }, [enableASR, micButtonRef, isRecording, value, lang])

  return (
    <>
      {renderComponent({
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        ref: inputRef,
        value: value,
        "data-testid": "google-transliterate-input",
        lang: lang,
        ...rest
      })}
      {shouldRenderSuggestions && options.length > 0 && effectivelyEnabled && (
        <div
          className={suggestionListClassName}
          style={{
            position: "absolute",
            left: `${left + offsetX}px`,
            top: `${top + offsetY}px`,
            ...containerStyles
          }}
        >
          {options.map((option, index) => (
            <div
              key={option}
              onClick={() => handleSelection(index)}
              className={
                index === selection
                  ? activeSuggestionItemClassName
                  : suggestionItemClassName
              }
              style={index === selection ? activeItemStyles : {}}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
