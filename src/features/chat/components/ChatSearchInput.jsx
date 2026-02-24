// src/features/chat/components/ChatSearchInput.jsx
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X } from 'lucide-react';
import { setSearchQuery } from '../store/chatSlice';
import { selectSearchQuery } from '../store/chatSelectors';

const DEBOUNCE_MS = 250;

/**
 * Controlled search input for the LLM sidebar.
 *
 * Local state holds the raw keystrokes; a 250 ms debounce timer fires
 * setSearchQuery into Redux so the selector only re-runs after the user
 * pauses — keeping every keystroke cheap.
 *
 * Hidden entirely when isOpen=false (icon-only sidebar mode).
 */
export function ChatSearchInput({ isOpen }) {
  const dispatch = useDispatch();

  // Mirror Redux value only on mount / external clears (e.g. logout)
  const reduxQuery = useSelector(selectSearchQuery);
  const [localValue, setLocalValue] = useState(reduxQuery);

  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  // ── Debounced dispatch ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const raw = e.target.value;
    setLocalValue(raw);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(setSearchQuery(raw));
    }, DEBOUNCE_MS);
  };

  // ── Clear button ─────────────────────────────────────────────────────────
  const handleClear = () => {
    setLocalValue('');
    dispatch(setSearchQuery(''));
    clearTimeout(debounceRef.current);
    inputRef.current?.focus();
  };

  // ── Cleanup timer on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  // ── Sync if Redux query is cleared externally (e.g. logout / nav) ────────
  useEffect(() => {
    if (reduxQuery === '' && localValue !== '') {
      setLocalValue('');
    }
  }, [reduxQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hidden in icon-only mode — keeps DOM clean and avoids mis-clicks
  if (!isOpen) return null;

  const isActive = localValue.length > 0;

  return (
    <div className="px-2 pb-2">
      <div
        className={[
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
          isActive
            ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-300'
            : 'border-gray-200 bg-gray-50 hover:border-gray-300',
        ].join(' ')}
      >
        {/* Leading icon */}
        <Search
          size={14}
          className={isActive ? 'text-orange-500 flex-shrink-0' : 'text-gray-400 flex-shrink-0'}
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder="Search chats…"
          aria-label="Search chat sessions"
          className={[
            'flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-gray-800',
            'placeholder-gray-400 focus:outline-none',
          ].join(' ')}
        />

        {/* Clear button — only visible when there is text */}
        {isActive && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-orange-500 hover:bg-orange-100 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
