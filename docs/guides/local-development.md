# Local Development Guide

This guide covers advanced development workflows, debugging techniques, and best practices for working with the Chat Arena Frontend.

## Table of Contents

- [Development Environment](#development-environment)
- [Development Workflow](#development-workflow)
- [Debugging Techniques](#debugging-techniques)
- [Working with State](#working-with-state)
- [API Development](#api-development)
- [Performance Profiling](#performance-profiling)
- [Testing Strategies](#testing-strategies)
- [Build and Deploy](#build-and-deploy)

---

## Development Environment

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "javascriptreact": "javascript"
  }
}
```

### Browser DevTools Setup

1. **React DevTools**
   - Install from Chrome/Firefox extension store
   - Use Components tab to inspect component tree
   - Use Profiler tab for performance analysis

2. **Redux DevTools**
   - Install from Chrome/Firefox extension store
   - View action history and state changes
   - Time-travel debugging

3. **Network Tab**
   - Filter by XHR/Fetch to see API calls
   - Check request/response payloads
   - Monitor streaming responses

---

## Development Workflow

### Starting the Dev Server

```bash
# Standard start
npm start

# With specific port
PORT=3001 npm start

# With HTTPS (for Firebase OAuth)
HTTPS=true npm start
```

### File Watching

The dev server watches for changes and hot-reloads:
- `.js/.jsx` files - Component updates
- `.css` files - Style injection
- `.json` files - Full reload

### Feature Flags

Use environment variables for feature flags:

```env
# .env.development.local
REACT_APP_ENABLE_DEBUG=true
REACT_APP_MOCK_API=false
```

Access in code:

```javascript
if (process.env.REACT_APP_ENABLE_DEBUG === 'true') {
  console.log('Debug mode enabled');
}
```

---

## Debugging Techniques

### Console Debugging

```javascript
// Basic logging
console.log('Value:', value);

// Grouped logging
console.group('Chat Message Flow');
console.log('Input:', input);
console.log('Processed:', processed);
console.groupEnd();

// Table view for arrays/objects
console.table(messages);

// Timing
console.time('API Call');
await api.get('/data');
console.timeEnd('API Call');
```

### React DevTools Debugging

1. **Component Inspection**
   - Select component in tree
   - View props, state, hooks
   - Edit values in real-time

2. **Component Highlighting**
   - Enable "Highlight updates"
   - See which components re-render

3. **Hook Inspection**
   - Expand hooks section
   - View useState, useEffect values

### Redux DevTools Debugging

1. **Action Inspection**
   ```
   Action: chat/addMessage
   Payload: { sessionId: "abc", content: "Hello" }
   State Diff: messages["abc"] += 1
   ```

2. **Time-Travel**
   - Click any action to revert state
   - Use slider for step-by-step replay

3. **State Export/Import**
   - Export current state as JSON
   - Import to reproduce bugs

### Breakpoint Debugging

```javascript
// In code
debugger; // Pauses execution

// In browser DevTools
// Sources tab > set breakpoint on line
// Right-click > "Add conditional breakpoint"
```

### Network Debugging

```javascript
// Log all API requests
// In shared/api/client.js

axios.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});
```

---

## Working with State

### Redux State Structure

```javascript
// Access in components
import { useSelector } from 'react-redux';

const MyComponent = () => {
  // Auth state
  const user = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  // Chat state
  const sessions = useSelector(state => state.chat.sessions);
  const activeSession = useSelector(state => state.chat.activeSession);
  const messages = useSelector(state => state.chat.messages);

  // Models state
  const models = useSelector(state => state.models.models);
};
```

### Creating Selectors

```javascript
// features/chat/store/selectors.js
import { createSelector } from '@reduxjs/toolkit';

// Basic selector
export const selectActiveSession = (state) => state.chat.activeSession;

// Memoized selector
export const selectActiveMessages = createSelector(
  [selectActiveSession, (state) => state.chat.messages],
  (session, messages) => session ? messages[session.id] || [] : []
);

// Parameterized selector
export const selectMessageById = (messageId) => createSelector(
  [(state) => state.chat.messages],
  (messages) => {
    for (const sessionMessages of Object.values(messages)) {
      const found = sessionMessages.find(m => m.id === messageId);
      if (found) return found;
    }
    return null;
  }
);
```

### Dispatching Actions

```javascript
import { useDispatch } from 'react-redux';
import { setSelectedMode, addMessage } from '../store/chatSlice';

const MyComponent = () => {
  const dispatch = useDispatch();

  const handleModeChange = (mode) => {
    dispatch(setSelectedMode(mode));
  };

  const handleAddMessage = (content) => {
    dispatch(addMessage({
      sessionId: activeSession.id,
      content,
      role: 'user',
    }));
  };
};
```

### Async Thunks

```javascript
import { createSession, fetchSessions } from '../store/chatSlice';

const MyComponent = () => {
  const dispatch = useDispatch();

  const handleCreateSession = async () => {
    try {
      const result = await dispatch(createSession()).unwrap();
      console.log('Session created:', result);
    } catch (error) {
      console.error('Failed:', error);
    }
  };
};
```

---

## API Development

### Mock API Responses

Create mock handlers for development:

```javascript
// src/mocks/handlers.js
export const mockHandlers = {
  '/api/sessions/': () => ({
    results: [
      { id: '1', title: 'Mock Session 1' },
      { id: '2', title: 'Mock Session 2' },
    ]
  }),

  '/api/models/': () => ({
    results: [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'claude-3', name: 'Claude 3' },
    ]
  }),
};
```

### API Client Debugging

```javascript
// shared/api/client.js - Add request/response logging

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Request logging
client.interceptors.request.use((config) => {
  if (process.env.REACT_APP_ENABLE_DEBUG === 'true') {
    console.log('Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
    });
  }
  return config;
});

// Response logging
client.interceptors.response.use(
  (response) => {
    if (process.env.REACT_APP_ENABLE_DEBUG === 'true') {
      console.log('Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);
```

### Streaming Response Testing

```javascript
// Test streaming manually
const testStreaming = async () => {
  const response = await fetch('/api/messages/stream/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify({
      session_id: 'test-session',
      content: 'Hello, world!',
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log('Chunk:', decoder.decode(value));
  }
};
```

---

## Performance Profiling

### React Profiler

1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Perform actions
5. Stop recording
6. Analyze flame graph

### Identifying Unnecessary Renders

```javascript
// Add to component for render logging
useEffect(() => {
  console.log('Component rendered');
});

// Use React DevTools "Highlight updates" feature
```

### Optimizing with memo

```javascript
// Before: Renders on every parent update
const MessageItem = ({ message }) => {
  return <div>{message.content}</div>;
};

// After: Only renders when message changes
const MessageItem = React.memo(({ message }) => {
  return <div>{message.content}</div>;
});

// With custom comparison
const MessageItem = React.memo(
  ({ message }) => <div>{message.content}</div>,
  (prevProps, nextProps) => prevProps.message.id === nextProps.message.id
);
```

### Optimizing Selectors

```javascript
// Bad: Creates new array every render
const messages = useSelector(state =>
  state.chat.messages[sessionId]?.filter(m => m.role === 'user')
);

// Good: Memoized selector
const selectUserMessages = createSelector(
  [state => state.chat.messages, (_, sessionId) => sessionId],
  (messages, sessionId) =>
    messages[sessionId]?.filter(m => m.role === 'user') || []
);

const messages = useSelector(state => selectUserMessages(state, sessionId));
```

### Bundle Analysis

```bash
# Generate bundle analysis
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

---

## Testing Strategies

### Unit Testing Components

```javascript
// features/chat/components/__tests__/MessageInput.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MessageInput from '../MessageInput';
import chatReducer from '../../store/chatSlice';

const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: { chat: chatReducer },
    preloadedState,
  });

describe('MessageInput', () => {
  it('submits message on enter', () => {
    const mockOnSend = jest.fn();
    const store = createTestStore();

    render(
      <Provider store={store}>
        <MessageInput onSend={mockOnSend} />
      </Provider>
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnSend).toHaveBeenCalledWith('Hello');
  });
});
```

### Testing Hooks

```javascript
// features/chat/hooks/__tests__/useDebounce.test.js
import { renderHook, act } from '@testing-library/react';
import useDebounce from '../useDebounce';

describe('useDebounce', () => {
  jest.useFakeTimers();

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial'); // Still old value

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated'); // Now updated
  });
});
```

### Testing Redux Slices

```javascript
// features/chat/store/__tests__/chatSlice.test.js
import chatReducer, { setSelectedMode, addMessage } from '../chatSlice';

describe('chatSlice', () => {
  const initialState = {
    selectedMode: 'random',
    messages: {},
  };

  it('should set selected mode', () => {
    const newState = chatReducer(initialState, setSelectedMode('compare'));
    expect(newState.selectedMode).toBe('compare');
  });

  it('should add message to session', () => {
    const message = { id: '1', content: 'Hello', role: 'user' };
    const newState = chatReducer(
      { ...initialState, messages: { 'session-1': [] } },
      addMessage({ sessionId: 'session-1', message })
    );
    expect(newState.messages['session-1']).toContainEqual(message);
  });
});
```

---

## Build and Deploy

### Development Build

```bash
npm start
# Runs on localhost:3000
# Includes source maps
# Hot module replacement enabled
```

### Production Build

```bash
npm run build

# Output in /build directory:
# - Minified JavaScript
# - Optimized CSS
# - Static assets with hashed filenames
```

### Build Verification

```bash
# Serve production build locally
npm install -g serve
serve -s build

# Or use npx
npx serve -s build
```

### Environment-Specific Builds

```bash
# Create environment-specific .env files
.env                    # Default values
.env.local              # Local overrides (git-ignored)
.env.development        # Development environment
.env.production         # Production environment

# Build with specific environment
# CRA automatically uses .env.production for builds
npm run build
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Build succeeds without errors
- [ ] All tests pass
- [ ] No console errors in production build
- [ ] Bundle size within acceptable limits
- [ ] API endpoints point to production
- [ ] Firebase configured for production domain

---

## Useful Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "analyze": "npm run build && npx source-map-explorer 'build/static/js/*.js'"
  }
}
```

---

## Related Documentation

- [Getting Started](getting-started.md)
- [Architecture Overview](../../ARCHITECTURE.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Internal API](../api/internal-api.md)