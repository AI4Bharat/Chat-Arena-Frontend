# Internal API Documentation

This document covers the frontend's internal APIs, including custom hooks, utility functions, and service interfaces.

## Table of Contents

- [Custom Hooks](#custom-hooks)
- [Redux Actions & Selectors](#redux-actions--selectors)
- [API Client](#api-client)
- [Utility Functions](#utility-functions)
- [Component APIs](#component-apis)

---

## Custom Hooks

### Authentication Hooks

#### `useGuestLimitations`

Manages guest user quotas for messages and sessions.

```javascript
import { useGuestLimitations } from 'features/chat/hooks';

const { checkLimit, incrementCount, isNearLimit } = useGuestLimitations();

// Check before sending message
const canSend = checkLimit('messages');

// Increment after successful action
await sendMessage(content);
incrementCount('messages');

// Show warning UI
if (isNearLimit) {
  showWarningBanner();
}
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `checkLimit(type)` | `(type: 'messages' \| 'sessions') => boolean` | Returns true if action is allowed |
| `incrementCount(type)` | `(type: 'messages' \| 'sessions') => void` | Increments usage counter |
| `isNearLimit` | `boolean` | True if at 80%+ of quota |
| `messageCount` | `number` | Current message count |
| `sessionCount` | `number` | Current session count |

**Limits:**
- Messages: 20 per guest
- Sessions: 3 per guest
- Warning threshold: 80% (16 messages)

---

### Streaming Hooks

#### `useStreamingMessage`

Handles real-time message streaming for single-model chat.

```javascript
import { useStreamingMessage } from 'features/chat/hooks';

const {
  sendMessage,
  isStreaming,
  error,
  cancelStream,
} = useStreamingMessage(sessionId);

// Send a message
await sendMessage('Hello, how are you?');

// Cancel ongoing stream
cancelStream();
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | `string` | Current chat session ID |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `sendMessage(content)` | `(content: string) => Promise<void>` | Sends message and starts stream |
| `isStreaming` | `boolean` | True while stream is active |
| `error` | `string \| null` | Error message if stream failed |
| `cancelStream()` | `() => void` | Aborts current stream |

---

#### `useStreamingMessageCompare`

Handles parallel streaming for compare mode (two models).

```javascript
import { useStreamingMessageCompare } from 'features/chat/hooks';

const {
  sendCompareMessage,
  isStreamingA,
  isStreamingB,
  errorA,
  errorB,
} = useStreamingMessageCompare(sessionId);

// Send to both models
await sendCompareMessage('Explain quantum computing');
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `sendCompareMessage(content)` | `(content: string) => Promise<void>` | Sends to both models |
| `isStreamingA` | `boolean` | Model A stream status |
| `isStreamingB` | `boolean` | Model B stream status |
| `errorA` | `string \| null` | Model A error |
| `errorB` | `string \| null` | Model B error |

---

### Utility Hooks

#### `useDebounce`

Debounces a value by specified delay.

```javascript
import { useDebounce } from 'shared/hooks';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  // Only fires 300ms after last change
  performSearch(debouncedSearch);
}, [debouncedSearch]);
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `T` | - | Value to debounce |
| `delay` | `number` | `500` | Delay in milliseconds |

**Returns:** `T` - Debounced value

---

#### `useLocalStorage`

Persists state in localStorage with JSON serialization.

```javascript
import { useLocalStorage } from 'shared/hooks';

const [preferences, setPreferences] = useLocalStorage('user_prefs', {
  theme: 'light',
  language: 'en',
});

// Updates both state and localStorage
setPreferences({ ...preferences, theme: 'dark' });
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | localStorage key |
| `initialValue` | `T` | Default value if key not found |

**Returns:** `[T, (value: T) => void]` - State tuple

---

#### `usePrivacyConsent`

Manages privacy consent modal state.

```javascript
import { usePrivacyConsent } from 'features/chat/hooks';

const { hasConsent, showModal, handleAccept, handleDecline } = usePrivacyConsent();

// Check before first message
if (!hasConsent) {
  showModal();
  return;
}
```

---

## Redux Actions & Selectors

### Auth Slice

#### Actions

```javascript
import {
  loginWithGoogle,
  loginAnonymously,
  logout,
  fetchCurrentUser,
  refreshToken,
} from 'features/auth/store/authSlice';

// Dispatch actions
dispatch(loginWithGoogle());
dispatch(loginAnonymously({ displayName: 'Guest User' }));
dispatch(logout());
dispatch(fetchCurrentUser());
```

#### Selectors

```javascript
// State selectors
const user = useSelector(state => state.auth.user);
const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
const isAnonymous = useSelector(state => state.auth.isAnonymous);
const loading = useSelector(state => state.auth.loading);
const error = useSelector(state => state.auth.error);
const initialized = useSelector(state => state.auth.initialized);
const isUnderMaintenance = useSelector(state => state.auth.isUnderMaintenance);
```

---

### Chat Slice

#### Actions

```javascript
import {
  // Thunks
  createSession,
  fetchSessions,
  fetchSessionById,

  // Reducers
  setSelectedMode,
  setSelectedModels,
  setActiveSession,
  addMessage,
  updateStreamingMessage,
  clearStreamingMessage,
  setMessageError,
  setSelectedLanguage,
  setTranslateEnabled,
} from 'features/chat/store/chatSlice';
```

#### Action Payloads

| Action | Payload |
|--------|---------|
| `setSelectedMode` | `'random' \| 'direct' \| 'compare'` |
| `setSelectedModels` | `{ modelA?: Model, modelB?: Model }` |
| `addMessage` | `{ sessionId: string, message: Message }` |
| `updateStreamingMessage` | `{ sessionId: string, content: string }` |

#### Selectors

```javascript
const sessions = useSelector(state => state.chat.sessions);
const activeSession = useSelector(state => state.chat.activeSession);
const messages = useSelector(state => state.chat.messages);
const selectedMode = useSelector(state => state.chat.selectedMode);
const selectedModels = useSelector(state => state.chat.selectedModels);
const streamingMessages = useSelector(state => state.chat.streamingMessages);
```

---

### Models Slice

#### Actions

```javascript
import { fetchModels, testModel } from 'features/models/store/modelsSlice';

dispatch(fetchModels());
dispatch(testModel({ modelId: 'gpt-4', prompt: 'Hello' }));
```

#### Selectors

```javascript
const models = useSelector(state => state.models.models);
const loading = useSelector(state => state.models.loading);
```

---

## API Client

### Configuration

```javascript
// shared/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
});
```

### Request Interceptor

Automatically adds authentication headers:

```javascript
// Bearer token for authenticated users
Authorization: Bearer <access_token>

// Or anonymous token for guests
X-Anonymous-Token: <anonymous_token>
```

### Response Interceptor

Handles:
- 401: Automatic token refresh and retry
- 500/503: Maintenance mode activation
- Network errors: Retry with backoff

### API Methods

```javascript
import api from 'shared/api/client';

// GET request
const response = await api.get('/sessions/');

// POST request
const response = await api.post('/sessions/', { title: 'New Session' });

// PUT request
const response = await api.put('/sessions/123/', { title: 'Updated' });

// DELETE request
const response = await api.delete('/sessions/123/');
```

### Endpoints Reference

```javascript
// shared/api/endpoints.js
export const ENDPOINTS = {
  // Auth
  AUTH_GOOGLE: '/auth/google/',
  AUTH_ANONYMOUS: '/auth/anonymous/',
  AUTH_REFRESH: '/auth/refresh/',
  USER_ME: '/users/me/',
  USER_PREFERENCES: '/users/update_preferences/',

  // Sessions
  SESSIONS: '/sessions/',
  SESSION_DETAIL: (id) => `/sessions/${id}/`,
  SESSION_SHARE: (id) => `/sessions/${id}/share/`,
  SESSION_EXPORT: (id) => `/sessions/${id}/export/`,

  // Messages
  MESSAGES_STREAM: '/messages/stream/',
  MESSAGE_REGENERATE: (id) => `/messages/${id}/regenerate/`,
  MESSAGE_TREE: (id) => `/messages/${id}/tree/`,

  // Feedback
  FEEDBACK: '/feedback/',
  FEEDBACK_SUMMARY: '/feedback/session_summary/',

  // Models & Leaderboard
  MODELS: '/models/',
  LEADERBOARD: '/leaderboard/',
  LEADERBOARD_CATEGORIES: '/leaderboard/categories/',
};
```

---

## Utility Functions

### Date Formatting

```javascript
import { formatDate, formatRelativeTime } from 'shared/utils/date';

// Format as "Jan 15, 2024"
formatDate(new Date());

// Format as "2 hours ago"
formatRelativeTime(timestamp);
```

### Class Name Utilities

```javascript
import { cn } from 'shared/utils/cn';

// Combines clsx and tailwind-merge
<div className={cn(
  'base-class',
  isActive && 'active-class',
  className // Override classes
)}>
```

### Markdown Processing

```javascript
import { sanitizeMarkdown, parseCodeBlocks } from 'shared/utils/markdown';

// Sanitize user input
const safe = sanitizeMarkdown(userInput);

// Extract code blocks with language
const blocks = parseCodeBlocks(content);
// [{ language: 'javascript', code: '...' }, ...]
```

---

## Component APIs

### MessageInput

```jsx
import { MessageInput } from 'features/chat/components';

<MessageInput
  onSend={(content) => handleSend(content)}
  disabled={isStreaming}
  placeholder="Type your message..."
  autoFocus={true}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSend` | `(content: string) => void` | Required | Called on submit |
| `disabled` | `boolean` | `false` | Disables input |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount |

---

### ModelSelector

```jsx
import { ModelSelector } from 'features/chat/components';

<ModelSelector
  mode={selectedMode}
  onModeChange={handleModeChange}
  selectedModels={selectedModels}
  onModelChange={handleModelChange}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `'random' \| 'direct' \| 'compare'` | Current mode |
| `onModeChange` | `(mode: string) => void` | Mode change handler |
| `selectedModels` | `{ modelA, modelB }` | Selected model objects |
| `onModelChange` | `(models) => void` | Model selection handler |

---

### MessageItem

```jsx
import { MessageItem } from 'features/chat/components';

<MessageItem
  message={message}
  onRegenerate={() => handleRegenerate(message.id)}
  onFeedback={(rating) => handleFeedback(message.id, rating)}
  showActions={true}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `message` | `Message` | Message object |
| `onRegenerate` | `() => void` | Regenerate callback |
| `onFeedback` | `(rating: number) => void` | Feedback callback |
| `showActions` | `boolean` | Show action buttons |
| `isStreaming` | `boolean` | Show streaming indicator |

---

### ErrorBoundary

```jsx
import { ErrorBoundary } from 'shared/components';

<ErrorBoundary
  fallback={<CustomErrorPage />}
  onError={(error, errorInfo) => logError(error, errorInfo)}
>
  <App />
</ErrorBoundary>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `fallback` | `ReactNode` | Fallback UI on error |
| `onError` | `(error, info) => void` | Error callback |
| `children` | `ReactNode` | Components to wrap |

---

## Type Definitions

### Message

```typescript
interface Message {
  id: string;
  session_id: string;
  content: string;
  role: 'user' | 'assistant';
  model?: string;
  participant?: 'a' | 'b';
  created_at: string;
  status: 'pending' | 'streaming' | 'complete' | 'error';
  error?: string;
}
```

### Session

```typescript
interface Session {
  id: string;
  title: string;
  mode: 'random' | 'direct' | 'compare';
  created_at: string;
  updated_at: string;
  message_count: number;
  models?: {
    modelA?: Model;
    modelB?: Model;
  };
}
```

### Model

```typescript
interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
  capabilities?: string[];
  available: boolean;
}
```

### User

```typescript
interface User {
  id: string;
  email?: string;
  display_name: string;
  is_anonymous: boolean;
  preferences?: {
    theme: 'light' | 'dark';
    language: string;
  };
  created_at: string;
}
```

---

## Related Documentation

- [Architecture Overview](../../ARCHITECTURE.md)
- [Getting Started](../guides/getting-started.md)
- [Glossary](../reference/glossary.md)