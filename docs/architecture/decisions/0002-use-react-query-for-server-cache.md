# ADR 0002: Use React Query for Server Cache

## Status

Accepted

## Context

While Redux handles global UI state, we identified a distinct category of state: **server cache**. This includes:
- Leaderboard rankings
- Model metadata
- Public configuration data

Server cache has different requirements:
- Automatic background refetching
- Cache invalidation strategies
- Stale-while-revalidate patterns
- Request deduplication

Mixing server cache with UI state in Redux leads to:
- Complex loading/error state management
- Manual cache invalidation
- No automatic refetching

### Options Considered

1. **Keep Everything in Redux**
   - Consistent mental model
   - Manual cache management
   - More boilerplate for server state

2. **TanStack React Query**
   - Purpose-built for server state
   - Automatic cache management
   - Built-in retry logic
   - DevTools available

3. **SWR**
   - Similar to React Query
   - Smaller bundle
   - Less feature-rich

4. **RTK Query**
   - Integrated with Redux Toolkit
   - Code generation
   - Less flexible than React Query

## Decision

We chose **TanStack React Query** for server cache management, complementing Redux for global UI state.

## Rationale

1. **Separation of Concerns**: Clear distinction between UI state (Redux) and server cache (React Query).

2. **Automatic Features**: Background refetching, request deduplication, and retry logic out of the box.

3. **Stale-While-Revalidate**: Shows cached data immediately while fetching fresh data.

4. **DevTools**: Dedicated DevTools for inspecting cache state.

5. **Flexibility**: Works alongside Redux without conflicts.

## Implementation

```javascript
// queryClient.js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Usage Pattern

```javascript
// Leaderboard component
const { data, isLoading, error } = useQuery({
  queryKey: ['leaderboard', category, period],
  queryFn: () => api.get('/leaderboard/', { params: { category, period } }),
});
```

## Consequences

### Positive

- Automatic cache management for server data
- Reduced boilerplate for data fetching
- Better UX with background updates
- Clear separation of state types

### Negative

- Two state management systems to understand
- Additional dependency
- Need to decide which system for each piece of state

### Guidelines

| State Type | Solution |
|------------|----------|
| User session | Redux |
| Chat messages | Redux |
| Streaming state | Redux |
| Mode/model selection | Redux |
| Leaderboard data | React Query |
| Public configurations | React Query |

## Related

- [ADR 0001: Use Redux Toolkit](0001-use-redux-toolkit-for-global-state.md)