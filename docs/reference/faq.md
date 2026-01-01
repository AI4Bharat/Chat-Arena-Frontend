# Frequently Asked Questions

Common questions about developing with the Chat Arena Frontend.

---

## Setup & Installation

### Q: What Node.js version do I need?

**A:** Node.js 18 or higher is required. Check your version with:

```bash
node --version
```

If you need to manage multiple Node versions, consider using [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm).

---

### Q: How do I configure Firebase for local development?

**A:**
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Google Sign-In provider in Authentication settings
3. Add `localhost` to authorized domains
4. Copy configuration to your `.env` file:

```env
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project
REACT_APP_FIREBASE_APP_ID=your_app_id
```

**Tip:** You can develop with anonymous authentication only by skipping Firebase setup.

---

### Q: The app shows "Maintenance Mode" - what's wrong?

**A:** This happens when the frontend can't connect to the backend API. Check:

1. Backend server is running at `REACT_APP_API_URL`
2. CORS is properly configured on the backend
3. No firewall blocking the connection
4. API URL is correct in your `.env` file

---

## Development

### Q: How do I add a new feature?

**A:** Follow the feature-based structure:

1. Create a directory in `src/features/`:
   ```
   features/
   └── your-feature/
       ├── components/
       ├── hooks/
       ├── store/
       └── index.js
   ```

2. Create the Redux slice in `store/`
3. Add components in `components/`
4. Export public API in `index.js`
5. Register routes in `app/router.jsx` if needed

See [ADR 0003](../architecture/decisions/0003-feature-based-folder-structure.md) for details.

---

### Q: Where do I put shared code?

**A:** Code used by multiple features goes in `src/shared/`:

| Type | Location |
|------|----------|
| API utilities | `shared/api/` |
| Common components | `shared/components/` |
| Utility hooks | `shared/hooks/` |
| Helper functions | `shared/utils/` |
| Icons | `shared/icons/` |

---

### Q: How do I add a new Redux action?

**A:** Add actions in the relevant slice:

```javascript
// features/chat/store/chatSlice.js
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Add synchronous action
    myNewAction: (state, action) => {
      state.someValue = action.payload;
    },
  },
});

// For async actions, use createAsyncThunk
export const myAsyncAction = createAsyncThunk(
  'chat/myAsyncAction',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.post('/endpoint/', params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

---

### Q: How do I debug streaming issues?

**A:**
1. Open Browser DevTools > Network tab
2. Find the `/messages/stream/` request
3. Click on it and check the "EventStream" or "Response" tab
4. You should see chunks arriving in real-time

Common issues:
- **No chunks arriving**: Backend not streaming properly
- **Malformed chunks**: Check SSE format (`data: {...}`)
- **Connection dropping**: Check for timeout settings

You can also add debug logging:

```javascript
// In useStreamingMessage.js
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  console.log('Chunk:', new TextDecoder().decode(value));
  if (done) break;
}
```

---

### Q: Why are my components re-rendering too often?

**A:** Common causes:

1. **New object/array references in props:**
   ```jsx
   // Bad: Creates new array every render
   <Component items={data.filter(x => x.active)} />

   // Good: Memoize the filtered array
   const activeItems = useMemo(() => data.filter(x => x.active), [data]);
   <Component items={activeItems} />
   ```

2. **Inline function props:**
   ```jsx
   // Bad: New function every render
   <Button onClick={() => handleClick(id)} />

   // Good: Use useCallback
   const handleButtonClick = useCallback(() => handleClick(id), [id]);
   <Button onClick={handleButtonClick} />
   ```

3. **Redux selector creating new references:**
   ```javascript
   // Bad: Filter creates new array
   const messages = useSelector(state =>
     state.chat.messages.filter(m => m.sessionId === id)
   );

   // Good: Use createSelector for memoization
   ```

Use React DevTools Profiler to identify unnecessary renders.

---

## State Management

### Q: When should I use Redux vs React Query?

**A:**

| Use Redux for: | Use React Query for: |
|----------------|---------------------|
| User authentication state | Leaderboard data |
| Chat sessions and messages | Public configurations |
| UI mode selections | Server data with caching needs |
| Streaming message state | Data that benefits from background refetch |

See [ADR 0001](../architecture/decisions/0001-use-redux-toolkit-for-global-state.md) and [ADR 0002](../architecture/decisions/0002-use-react-query-for-server-cache.md).

---

### Q: How do I access Redux state in a component?

**A:**

```javascript
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedMode } from 'features/chat/store/chatSlice';

const MyComponent = () => {
  // Read state
  const selectedMode = useSelector(state => state.chat.selectedMode);
  const user = useSelector(state => state.auth.user);

  // Dispatch actions
  const dispatch = useDispatch();
  const handleModeChange = (mode) => {
    dispatch(setSelectedMode(mode));
  };

  return (/* ... */);
};
```

---

## Styling

### Q: How do I add custom Tailwind colors?

**A:** Extend the theme in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          500: '#f97316',
          900: '#7c2d12',
        },
      },
    },
  },
};
```

Then use: `bg-brand-500`, `text-brand-900`, etc.

---

### Q: How do I handle conditional classes?

**A:** Use `clsx` or the `cn` utility:

```javascript
import { cn } from 'shared/utils/cn';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes',
  className // Allow override from props
)}>
```

---

## Testing

### Q: How do I run specific tests?

**A:**

```bash
# Run all tests
npm test

# Run tests for a specific file
npm test -- MessageInput

# Run tests matching a pattern
npm test -- --testPathPattern=chat

# Run with coverage
npm test -- --coverage

# Run once (not watch mode)
npm test -- --watchAll=false
```

---

### Q: How do I test components that use Redux?

**A:** Wrap components with a test store:

```javascript
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from 'features/chat/store/chatSlice';

const renderWithRedux = (component, preloadedState = {}) => {
  const store = configureStore({
    reducer: { chat: chatReducer },
    preloadedState,
  });

  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

// Usage
renderWithRedux(<MyComponent />, {
  chat: { selectedMode: 'direct' }
});
```

---

## Deployment

### Q: How do I build for production?

**A:**

```bash
# Create production build
npm run build

# The output is in /build directory
# It's ready to be served by any static file server
```

---

### Q: How do I verify my build works?

**A:**

```bash
# Serve the production build locally
npx serve -s build

# Or install serve globally
npm install -g serve
serve -s build
```

Open `http://localhost:3000` to test.

---

### Q: Why does my production build show a blank page?

**A:** Common causes:

1. **Wrong homepage**: Check `package.json` for `homepage` field
2. **Router issue**: Ensure HashRouter is used for static hosting
3. **Console errors**: Check browser console for JavaScript errors
4. **Environment variables**: Verify `.env.production` has correct values

---

## Troubleshooting

### Q: I see "Invalid token" errors - what do I do?

**A:**
1. Clear localStorage: `localStorage.clear()` in console
2. Refresh the page
3. Sign in again

If persists, check that your backend auth endpoints are working.

---

### Q: Hot reload isn't working - changes don't appear

**A:**
1. Check terminal for errors
2. Try `Ctrl+C` and restart `npm start`
3. Clear browser cache
4. Check for syntax errors in your file

---

### Q: I'm getting CORS errors

**A:** CORS must be configured on the backend. For local development:

1. Ensure backend allows `http://localhost:3000`
2. Check `withCredentials: true` in axios config
3. Verify backend sends proper CORS headers

---

## Still Have Questions?

- Check the [Glossary](glossary.md) for term definitions
- Read the [Architecture Documentation](../../ARCHITECTURE.md)
- Open an issue on GitHub
- Search existing issues for similar problems