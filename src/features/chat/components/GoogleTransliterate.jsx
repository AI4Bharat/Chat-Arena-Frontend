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

// Language code mapping
const LANGUAGE_MAP = {
  'hi': 'hi',
  'bn': 'bn',
  'ta': 'ta',
  'te': 'te',
  'ml': 'ml',
  'kn': 'kn',
  'mr': 'mr',
  'gu': 'gu',
  'pa': 'pa',
  'ne': 'ne',
  'si': 'si',
  'ur': 'ur',
  'ar': 'ar',
  'th': 'th',
  'ind': 'id',
}

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
  )}&itc=${googleLang}-t-i0-und&num=${maxOptions}&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data && data[0] === "SUCCESS" && data[1] && data[1][0] && data[1][0][1]) {
      const suggestions = data[1][0][1]
      const result = showCurrentWordAsLastSuggestion
        ? [...suggestions, word]
        : suggestions

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
  // ... rest of the component code stays the same ...
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const [selection, setSelection] = useState(0)
  const [matchStart, setMatchStart] = useState(-1)
  const [matchEnd, setMatchEnd] = useState(-1)
  const inputRef = useRef(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [options, setOptions] = useState([])

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

    const e = {
      target: { value: newValue }
    }
    onChangeText(newValue)
    onChange && onChange(e)

    reset()
    return inputRef.current?.focus()
  }

  const renderSuggestions = async (lastWord) => {
    if (!shouldRenderSuggestions) {
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

    if (!shouldRenderSuggestions) {
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
    
    if (currentWord && enabled) {
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
            const newValue = currentText.slice(0, cursorPos) + transcript + currentText.slice(cursorPos)

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
        headers: { "Content-Type": "application/json", "Authorization": apiKey },
        body: JSON.stringify({ audioBase64: base64Audio, lang })
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
      {shouldRenderSuggestions && options.length > 0 && (
        <ul
          onMouseDown={e => e.preventDefault()}
          style={{
            position: "absolute",
            top: `${top}px`,
            left: `${left}px`,
            zIndex: 20000,
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "4px",
            listStyle: "none",
            padding: "4px 0",
            margin: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            maxHeight: "200px",
            overflowY: "auto",
            minWidth: `${OPTION_LIST_MIN_WIDTH}px`,
          }}
          className={suggestionListClassName}
          data-testid="google-transliterate-suggestions"
          lang={lang}
          role="listbox"
        >
          {Array.from(new Set(options)).map((item, index) => (
            <li
              className={
                index === selection
                  ? activeSuggestionItemClassName
                  : suggestionItemClassName
              }
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                backgroundColor: index === selection ? "#e3f2fd" : "white",
                ...(index === selection && activeItemStyles)
              }}
              onMouseEnter={() => setSelection(index)}
              onClick={() => handleSelection(index)}
              key={item}
              role="option"
              aria-selected={index === selection}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
