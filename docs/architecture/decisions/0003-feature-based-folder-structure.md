# ADR 0003: Adopt Feature-Based Folder Structure

## Status

Accepted

## Context

As the application grew, we needed to organize code in a way that:
- Makes it easy to find related code
- Supports team collaboration
- Scales with new features
- Reduces coupling between features

### Options Considered

1. **Type-Based Structure**
   ```
   src/
   ├── components/
   ├── hooks/
   ├── services/
   ├── store/
   └── utils/
   ```
   - Traditional React structure
   - Related code spread across directories
   - Hard to understand feature boundaries

2. **Feature-Based Structure**
   ```
   src/
   ├── features/
   │   ├── auth/
   │   │   ├── components/
   │   │   ├── hooks/
   │   │   └── store/
   │   └── chat/
   │       ├── components/
   │       ├── hooks/
   │       └── store/
   └── shared/
   ```
   - Co-locates related code
   - Clear feature boundaries
   - Easier to understand and modify

3. **Atomic Design**
   ```
   src/
   ├── atoms/
   ├── molecules/
   ├── organisms/
   ├── templates/
   └── pages/
   ```
   - Design-focused organization
   - Less intuitive for business features
   - Harder to map to requirements

## Decision

We adopted a **feature-based folder structure** with a shared layer for cross-cutting concerns.

## Rationale

1. **Co-location**: All code for a feature lives together (components, hooks, store, services).

2. **Feature Isolation**: Changes to one feature are contained within its directory.

3. **Team Scalability**: Teams can work on features independently.

4. **Clear Boundaries**: Easy to see what constitutes a feature.

5. **Refactoring**: Moving or deleting features is straightforward.

## Implementation

```
src/
├── app/                    # Application-wide configuration
│   ├── store.js           # Redux store setup
│   ├── router.jsx         # Route definitions
│   └── queryClient.js     # React Query configuration
│
├── features/              # Feature modules
│   ├── auth/
│   │   ├── components/    # Auth-specific components
│   │   ├── services/      # Auth API calls
│   │   ├── store/         # authSlice
│   │   └── index.js       # Public exports
│   │
│   ├── chat/
│   │   ├── components/    # 31 chat components
│   │   ├── hooks/         # useStreamingMessage, etc.
│   │   ├── store/         # chatSlice
│   │   └── index.js
│   │
│   ├── leaderboard/
│   ├── models/
│   └── legal/
│
├── shared/                # Cross-cutting concerns
│   ├── api/              # HTTP client
│   ├── components/       # Shared UI (ErrorBoundary, Loading)
│   ├── hooks/            # Shared hooks (useDebounce)
│   ├── utils/            # Pure utilities
│   └── icons/            # Icon components
│
└── styles/               # Global styles
```

### Feature Module Guidelines

Each feature should:
- Have an `index.js` exporting its public API
- Keep internal components private
- Not import from other features' internals
- Use shared code for cross-cutting concerns

```javascript
// features/auth/index.js
export { LoginPage } from './components/LoginPage';
export { AuthModal } from './components/AuthModal';
export { selectUser, selectIsAuthenticated } from './store/authSlice';
```

## Consequences

### Positive

- Easy to understand feature scope
- Reduced coupling between features
- Simpler code reviews (changes scoped to feature)
- Straightforward onboarding

### Negative

- May lead to code duplication if not careful
- Requires discipline to use shared layer properly
- Initial setup complexity

### Guidelines

1. **When to create a feature**: When there's a cohesive set of components, state, and services for a domain.

2. **When to use shared**: When code is used by 2+ features or is a general utility.

3. **Avoiding circular dependencies**: Features should not import from each other. Use events or shared services.

## Related

- [Directory Structure](../../../ARCHITECTURE.md#directory-structure)