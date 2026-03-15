# Contributing to Chat Arena Frontend

Thank you for your interest in contributing to Chat Arena! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Code Style Guide](#code-style-guide)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Be respectful and considerate in all interactions
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes and learn from them

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/arena-frontend.git
   cd arena-frontend
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/AI4Bharat/arena-frontend.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

6. **Start development server**:
   ```bash
   npm start
   ```

---

## Development Workflow

### 1. Sync with Upstream

Before starting new work, sync your fork:

```bash
git checkout master
git fetch upstream
git merge upstream/master
git push origin master
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Write code following our [style guide](#code-style-guide)
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run the test suite
npm test

# Run linting
npm run lint

# Build to check for errors
npm run build
```

### 5. Commit Your Changes

Follow the [commit message format](#commit-message-format).

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Branch Naming Conventions

Use descriptive branch names with the following prefixes:

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New features | `feature/dark-mode-toggle` |
| `fix/` | Bug fixes | `fix/streaming-disconnect` |
| `refactor/` | Code refactoring | `refactor/auth-slice` |
| `docs/` | Documentation | `docs/api-documentation` |
| `test/` | Test additions | `test/chat-component-tests` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |

### Examples

```
feature/add-message-reactions
fix/login-redirect-loop
refactor/simplify-streaming-hook
docs/update-readme
chore/upgrade-react-19
```

---

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons, etc.) |
| `refactor` | Code refactoring (no feature change) |
| `test` | Adding or updating tests |
| `chore` | Maintenance, dependencies, configs |
| `perf` | Performance improvements |

### Scopes

- `auth` - Authentication related
- `chat` - Chat functionality
- `leaderboard` - Leaderboard feature
- `api` - API client/endpoints
- `ui` - UI components
- `store` - Redux store/slices
- `hooks` - Custom hooks
- `deps` - Dependencies

### Examples

```bash
# Feature
feat(chat): add message reaction support

# Bug fix
fix(auth): resolve token refresh race condition

# Documentation
docs(readme): update installation instructions

# Refactor
refactor(chat): simplify streaming message hook

# With body
feat(leaderboard): add category filtering

Added ability to filter leaderboard by category:
- Overall, Creative Writing, Coding, Reasoning
- Persistent filter selection via URL params
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows the style guide
- [ ] Tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated if needed
- [ ] Commits follow the message format

### PR Title

Use the same format as commit messages:

```
feat(chat): add voice input support
fix(auth): resolve Google OAuth popup blocked issue
```

### PR Description Template

```markdown
## Summary

Brief description of the changes.

## Changes

- List of specific changes
- Another change
- And another

## Testing

How to test these changes:
1. Step one
2. Step two
3. Expected result

## Screenshots (if UI changes)

| Before | After |
|--------|-------|
| image  | image |

## Related Issues

Closes #123
Relates to #456

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Reviewed my own code
- [ ] No console.log or debug code
```

### Review Process

1. **Automated checks** run on PR creation
2. **Code review** by at least one maintainer
3. **Address feedback** via new commits (don't force push)
4. **Squash and merge** once approved

### Review Checklist for Reviewers

- [ ] Code is readable and well-structured
- [ ] Changes are appropriately scoped
- [ ] No unnecessary dependencies added
- [ ] Error handling is appropriate
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Tests cover the changes

---

## Code Style Guide

### General Principles

- Write clear, self-documenting code
- Prefer readability over cleverness
- Keep functions small and focused
- Follow existing patterns in the codebase

### JavaScript/JSX

We use ESLint with the React App configuration. Key rules:

```javascript
// Use functional components with hooks
const MyComponent = ({ prop }) => {
  const [state, setState] = useState(null);
  return <div>{state}</div>;
};

// Destructure props
const Button = ({ onClick, children, disabled = false }) => { ... };

// Use meaningful variable names
const userSessionCount = sessions.filter(s => s.userId === userId).length;
// NOT: const n = sessions.filter(s => s.userId === userId).length;

// Prefer async/await over .then()
const fetchData = async () => {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
};
```

### Component Structure

```jsx
// 1. Imports (grouped: react, external, internal, styles)
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '../shared/components';
import './Component.css';

// 2. Component definition
const MyComponent = ({ id, onUpdate }) => {
  // 3. Hooks (state, redux, custom)
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const data = useCustomHook(id);

  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [id]);

  // 5. Handlers
  const handleClick = () => {
    onUpdate(data);
  };

  // 6. Render helpers (if needed)
  const renderItems = () => { ... };

  // 7. Return JSX
  return (
    <div className="my-component">
      {loading ? <Loading /> : renderItems()}
    </div>
  );
};

// 8. Export
export default MyComponent;
```

### CSS/Tailwind

```jsx
// Prefer Tailwind classes
<button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg">

// Use clsx for conditional classes
<div className={clsx(
  'base-class',
  isActive && 'active-class',
  size === 'large' && 'large-class'
)}>

// Group related classes
<div className="
  flex items-center justify-between
  px-4 py-2
  bg-gray-100 dark:bg-gray-800
  rounded-lg shadow-sm
">
```

### Redux

```javascript
// Slice structure
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchData = createAsyncThunk(
  'slice/fetchData',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/data', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const slice = createSlice({
  name: 'slice',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatWindow.jsx` |
| Hooks | camelCase, use- prefix | `useStreamingMessage.js` |
| Utilities | camelCase | `formatDate.js` |
| Redux slices | camelCase, -Slice suffix | `chatSlice.js` |
| Services | camelCase, -Service suffix | `userService.js` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS.js` |

---

## Testing Requirements

### Test Coverage Goals

- New features should include tests
- Bug fixes should include regression tests
- Aim for meaningful coverage, not 100%

### Test Structure

```javascript
// ComponentName.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const mockHandler = jest.fn();
    render(<ComponentName onClick={mockHandler} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- ComponentName.test.js

# Run in watch mode
npm test -- --watch
```

---

## Documentation

### When to Update Docs

- Adding new features
- Changing existing behavior
- Adding new dependencies
- Modifying API contracts
- Updating configuration

### Documentation Locations

| Type | Location |
|------|----------|
| User-facing | README.md |
| Architecture | ARCHITECTURE.md |
| Contributing | CONTRIBUTING.md |
| API docs | docs/api/ |
| Guides | docs/guides/ |
| ADRs | docs/architecture/decisions/ |

### JSDoc Comments

Add JSDoc comments for:
- Exported functions
- Complex hooks
- Utility functions

```javascript
/**
 * Custom hook for streaming message responses from the API.
 *
 * @param {string} sessionId - The current session ID
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoScroll - Enable auto-scroll on new content
 * @returns {Object} Streaming controls and state
 */
export const useStreamingMessage = (sessionId, options = {}) => {
  // Implementation
};
```

---

## Questions?

- Check existing [issues](https://github.com/AI4Bharat/arena-frontend/issues)
- Open a new issue for discussion
- Reach out to maintainers

Thank you for contributing!
