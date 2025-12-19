# Glossary

This glossary defines key terms used throughout the Chat Arena Frontend codebase and documentation.

---

## A

### Access Token
A short-lived JWT (JSON Web Token) used to authenticate API requests. Stored in `localStorage` and automatically refreshed when expired.

### Action (Redux)
An object describing a state change in Redux. Actions have a `type` property and optional `payload`. Created using Redux Toolkit's `createSlice` or `createAsyncThunk`.

### ADR (Architecture Decision Record)
A document capturing a significant architectural decision, including context, decision rationale, and consequences. Located in `/docs/architecture/decisions/`.

### Anonymous User
A user who interacts with the app without signing in. Has limited quotas (20 messages, 3 sessions) and receives an `anonymous_token` for identification.

### AsyncThunk
A Redux Toolkit utility (`createAsyncThunk`) for handling async actions with automatic `pending`, `fulfilled`, and `rejected` states.

---

## B

### Blind Testing
A chat mode where users interact with AI models without knowing which model is responding. Used for unbiased model evaluation.

### Buffering
The practice of accumulating streaming response chunks before dispatching to Redux, reducing render frequency and improving performance.

---

## C

### Chat Mode
The interaction mode for a chat session. Options:
- **Direct**: Single model selection
- **Compare**: Two models side-by-side
- **Random/Blind**: Anonymous model comparison

### Chunk
A piece of streaming response data received from the backend. Chunks are processed incrementally as they arrive.

### Compare View
The UI layout showing two AI model responses side-by-side for comparison.

---

## D

### DevTools
Browser extensions for debugging:
- **React DevTools**: Component tree inspection
- **Redux DevTools**: Action and state debugging

### Direct Mode
Chat mode where users select and interact with a single specific AI model.

### Dispatch
The Redux function used to send actions to the store, triggering state updates.

---

## E

### Error Boundary
A React component that catches JavaScript errors in child components, preventing the entire app from crashing.

### EventSource
Browser API for Server-Sent Events (SSE). Not used directly in this app; we use Fetch API streaming instead.

---

## F

### Feature Module
A self-contained directory containing all code related to a specific feature (components, hooks, store, services).

### Firebase
Google's platform used for authentication. Provides Google OAuth sign-in functionality.

### Flush Interval
The time period (75ms) between dispatching buffered streaming updates to Redux.

---

## G

### Guest User
Synonym for Anonymous User. Has limited functionality until signing in.

### Guest Limitations
Quotas imposed on anonymous users:
- Maximum 20 messages
- Maximum 3 sessions

---

## H

### HashRouter
React Router component using hash-based URLs (`/#/path`). Used for compatibility with static hosting.

### Hook (React)
Functions that let you use React state and lifecycle features in functional components (e.g., `useState`, `useEffect`).

### Hot Module Replacement (HMR)
Development feature that updates modules in the browser without full page reload.

---

## I

### ID Token
A Firebase token received after Google OAuth authentication. Exchanged with the backend for access/refresh tokens.

### Immer
Library used by Redux Toolkit that allows writing "mutating" logic that safely produces immutable updates.

### Interceptor (Axios)
Functions that intercept requests or responses before they are handled. Used for adding auth headers and handling errors.

---

## J

### JWT (JSON Web Token)
A compact, URL-safe token format for transmitting claims between parties. Used for authentication.

---

## L

### Leaderboard
A ranking of AI models based on user feedback and comparisons. Updated in real-time as users rate responses.

### localStorage
Browser storage API for persisting data across sessions. Used for storing auth tokens and preferences.

---

## M

### Maintenance Mode
Application state when the backend is unavailable (500/503 errors). Shows a maintenance page while still allowing access to privacy/terms pages.

### Memoization
Optimization technique caching computation results. Implemented via `React.memo`, `useMemo`, and `createSelector`.

### Message Branching
Feature allowing users to create conversation branches by regenerating from any point in the chat history.

### MUI (Material-UI)
React component library providing pre-built UI components following Material Design.

---

## P

### Participant
In compare mode, the identifier for each model's response:
- `a` or `a0`: Model A
- `b` or `ad`: Model B

### Provider
React component that makes a value (like Redux store) available to all descendants. Common providers: `Provider` (Redux), `QueryClientProvider` (React Query).

---

## Q

### Query Client
TanStack React Query's central cache manager. Configured in `app/queryClient.js`.

### Quota
Limits on resource usage. Anonymous users have message and session quotas.

---

## R

### Random Mode
Chat mode where models are randomly assigned for blind comparison.

### React Query
Data fetching library (TanStack Query) for managing server state with automatic caching and background updates.

### ReadableStream
Web API for reading data in chunks. Used for consuming streaming AI responses.

### Reducer
A pure function that takes state and action, returning new state. Defined in Redux slices.

### Refresh Token
A long-lived token used to obtain new access tokens without re-authentication.

### Regenerate
Action to request a new AI response for an existing message, useful for comparing different outputs.

---

## S

### Selector
A function that extracts specific data from the Redux state. Can be memoized with `createSelector`.

### Session
A conversation container holding messages, mode, and model configuration.

### Slice
Redux Toolkit concept combining reducer logic, actions, and initial state for a feature.

### SSE (Server-Sent Events)
A standard for servers pushing data to clients. Our streaming format is SSE-like but uses Fetch API.

### Stale Time
React Query setting determining how long data is considered fresh before refetching (default: 5 minutes).

### Streaming
Real-time delivery of AI responses as they're generated, rather than waiting for the complete response.

---

## T

### Tailwind CSS
Utility-first CSS framework. Classes like `px-4`, `bg-blue-500` are applied directly in JSX.

### TextDecoder
Web API for decoding byte streams into text. Used for processing streaming response chunks.

### Thunk
A function that delays evaluation. In Redux, thunks enable async logic (created via `createAsyncThunk`).

### Token
A string representing authentication credentials:
- **Access Token**: Short-lived, for API requests
- **Refresh Token**: Long-lived, for getting new access tokens
- **Anonymous Token**: Guest identification

### Transliteration
Converting text from one script to another (e.g., Roman to Devanagari). Supported via AI4Bharat library.

---

## U

### Utility Class
A CSS class with a single purpose (e.g., `mt-4` for margin-top). Core concept of Tailwind CSS.

---

## W

### WebSocket
Protocol for bidirectional real-time communication. Available via Socket.io-client but not currently used for streaming.

### Windowing
Virtualization technique rendering only visible items in long lists. Improves performance for large message histories.

---

## Acronyms

| Acronym | Full Form |
|---------|-----------|
| ADR | Architecture Decision Record |
| API | Application Programming Interface |
| CDN | Content Delivery Network |
| CRA | Create React App |
| CSS | Cascading Style Sheets |
| DOM | Document Object Model |
| HMR | Hot Module Replacement |
| JWT | JSON Web Token |
| OAuth | Open Authorization |
| REST | Representational State Transfer |
| SPA | Single Page Application |
| SSE | Server-Sent Events |
| TTL | Time To Live |
| UI | User Interface |
| URL | Uniform Resource Locator |
| UX | User Experience |

---

## Related Documentation

- [Architecture Overview](../../ARCHITECTURE.md)
- [Internal API](../api/internal-api.md)
- [Getting Started](../guides/getting-started.md)