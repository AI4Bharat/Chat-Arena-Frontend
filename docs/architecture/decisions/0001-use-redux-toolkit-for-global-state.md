# ADR 0001: Use Redux Toolkit for Global State Management

## Status

Accepted

## Context

The Chat Arena application requires complex state management for:
- User authentication state
- Chat sessions and messages
- Real-time streaming message updates
- Model selection and configuration
- UI state coordination across multiple components

We needed to choose a state management solution that could handle:
- Predictable state updates
- Async operations (API calls)
- Real-time streaming updates
- DevTools integration for debugging
- Scalability as the application grows

### Options Considered

1. **React Context + useReducer**
   - Built-in to React
   - Simple for small apps
   - Performance issues with frequent updates
   - No middleware support

2. **Redux Toolkit**
   - Industry standard
   - Excellent DevTools
   - Built-in async handling (createAsyncThunk)
   - Immer for immutable updates
   - Strong TypeScript support

3. **Zustand**
   - Minimal boilerplate
   - Simple API
   - Good for smaller apps
   - Less ecosystem support

4. **MobX**
   - Automatic reactivity
   - Less boilerplate than Redux
   - Different mental model
   - Smaller community

## Decision

We chose **Redux Toolkit** as our global state management solution.

## Rationale

1. **Mature Ecosystem**: Redux has extensive documentation, community support, and proven patterns for complex applications.

2. **DevTools Integration**: Redux DevTools provides time-travel debugging, action logging, and state inspection essential for debugging streaming and async operations.

3. **Async Handling**: `createAsyncThunk` provides a standardized way to handle API calls with loading, success, and error states.

4. **Immer Integration**: Simplifies immutable updates with mutable syntax in reducers.

5. **Scalability**: The slice-based architecture scales well as features are added.

6. **Team Familiarity**: Redux is widely known, reducing onboarding friction for new contributors.

## Consequences

### Positive

- Predictable state updates with single source of truth
- Excellent debugging capabilities
- Standardized patterns across the codebase
- Easy to trace data flow through actions
- Server-side rendering compatible

### Negative

- More boilerplate than simpler solutions
- Learning curve for Redux concepts
- Requires discipline to avoid prop drilling (use selectors)

### Mitigations

- Use Redux Toolkit to minimize boilerplate
- Create reusable selectors with `createSelector`
- Use React Query for server cache (leaderboard data)
- Document slice patterns in codebase

## Related

- [ADR 0002: Use React Query for Server Cache](0002-use-react-query-for-server-cache.md)
- [Architecture Documentation](../../../ARCHITECTURE.md#state-management)