# Getting Started Guide

This guide will help you set up the Chat Arena Frontend for local development and make your first contribution.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [First Run](#first-run)
- [Codebase Tour](#codebase-tour)
- [Making Your First Change](#making-your-first-change)
- [Testing Locally](#testing-locally)
- [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or higher | JavaScript runtime |
| npm | 9.x or higher | Package manager |
| Git | 2.x or higher | Version control |

### Recommended Tools

| Tool | Purpose |
|------|---------|
| VS Code | Recommended IDE with React extensions |
| React DevTools | Browser extension for debugging |
| Redux DevTools | Browser extension for state inspection |

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check Git version
git --version
# Expected: 2.x.x or higher
```

---

## Environment Setup

### 1. Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/AI4Bharat/arena-frontend.git

# Or clone via SSH
git clone git@github.com:AI4Bharat/arena-frontend.git

# Navigate to project directory
cd arena-frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages from `package.json`.

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file (if available)
cp .env.example .env

# Or create a new file
touch .env
```

Add the following configuration:

```env
# ===================
# API Configuration
# ===================
# URL of the backend API server
REACT_APP_API_URL=http://localhost:8000/api

# ===================
# Firebase Configuration
# ===================
# Get these values from your Firebase Console
# Project Settings > General > Your apps > Web app

REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# ===================
# Optional Configuration
# ===================
# Enable/disable features for development
# REACT_APP_ENABLE_DEVTOOLS=true
```

### Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | Yes | Backend API base URL |
| `REACT_APP_FIREBASE_API_KEY` | Yes | Firebase API key |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `REACT_APP_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | No | Firebase storage bucket |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase messaging ID |
| `REACT_APP_FIREBASE_APP_ID` | Yes | Firebase app ID |

### 4. Set Up Firebase (Optional for Anonymous-Only Development)

If you only need anonymous user functionality:
1. Skip Firebase configuration
2. The app will automatically create anonymous sessions

For full Google OAuth:
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Sign-In provider
3. Add your localhost domain to authorized domains
4. Copy configuration values to `.env`

---

## First Run

### Start the Development Server

```bash
npm start
```

This will:
1. Start the webpack dev server
2. Open `http://localhost:3000` in your browser
3. Enable hot module replacement (HMR)

### Verify the Application

You should see:
1. The Chat Arena landing page
2. Ability to start a new chat
3. Model selector (if backend is running)
4. Anonymous user created automatically

### Backend Connection

The frontend expects a backend server at `REACT_APP_API_URL`. Without it:
- Most features won't work
- You'll see API connection errors
- Consider running the backend locally or using a dev environment

---

## Codebase Tour

### Entry Points

Start your exploration here:

| File | Purpose |
|------|---------|
| `src/index.js` | Application bootstrap, renders App |
| `src/App.jsx` | Root component, sets up providers |
| `src/app/router.jsx` | Route definitions |
| `src/app/store.js` | Redux store configuration |

### Key Directories

```
src/
├── app/                 # Start here: core configuration
│   ├── store.js        # Redux store setup
│   ├── router.jsx      # All routes defined here
│   └── queryClient.js  # React Query setup
│
├── features/           # Feature modules - main code
│   ├── auth/          # Authentication flow
│   ├── chat/          # Chat interface (largest module)
│   ├── leaderboard/   # Model rankings
│   └── models/        # Model management
│
└── shared/            # Reusable utilities
    ├── api/           # HTTP client setup
    └── components/    # Shared UI components
```

### Recommended Reading Order

1. **Understanding the App Structure**
   - `src/App.jsx` - See how providers wrap the app
   - `src/app/router.jsx` - Understand all available routes

2. **Understanding State Management**
   - `src/app/store.js` - How Redux is configured
   - `src/features/chat/store/chatSlice.js` - Main chat state

3. **Understanding the Chat Flow**
   - `src/features/chat/components/ChatLayout.jsx` - Main layout
   - `src/features/chat/components/MessageInput.jsx` - User input
   - `src/features/chat/hooks/useStreamingMessage.js` - Streaming logic

4. **Understanding Authentication**
   - `src/features/auth/store/authSlice.js` - Auth state
   - `src/features/auth/services/userService.js` - Auth API calls

---

## Making Your First Change

Let's walk through adding a simple feature: a tooltip to the New Chat button.

### Step 1: Find the Component

The New Chat button is in the sidebar:

```bash
# Search for "New Chat" text
grep -r "New Chat" src/
```

You'll find it in `src/features/chat/components/ChatSidebar.jsx`.

### Step 2: Open the File

```jsx
// src/features/chat/components/ChatSidebar.jsx
// Find the New Chat button section
```

### Step 3: Add Your Change

```jsx
// Before
<button className="new-chat-btn">
  New Chat
</button>

// After
<button
  className="new-chat-btn"
  title="Start a new conversation"  // Added tooltip
>
  New Chat
</button>
```

### Step 4: Test Your Change

1. Save the file
2. The browser auto-refreshes (HMR)
3. Hover over "New Chat" to see your tooltip

### Step 5: Commit Your Change

```bash
git add src/features/chat/components/ChatSidebar.jsx
git commit -m "feat(chat): add tooltip to New Chat button"
```

---

## Testing Locally

### Run the Test Suite

```bash
# Run all tests
npm test

# Run tests in watch mode (default)
npm test -- --watchAll

# Run tests with coverage
npm test -- --coverage

# Run a specific test file
npm test -- ChatSidebar.test.jsx
```

### Test Output

```
PASS  src/features/chat/components/__tests__/ChatSidebar.test.jsx
  ChatSidebar
    ✓ renders new chat button (45ms)
    ✓ shows session list (23ms)
    ✓ handles session selection (18ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

### Linting

```bash
# ESLint is run automatically by CRA
# Check for issues manually:
npm run lint  # if configured

# Or use IDE integration
```

### Build Verification

```bash
# Verify production build works
npm run build

# The build output will be in /build directory
```

---

## Common Issues

### Issue: "Module not found" Errors

**Symptom**: Import errors on startup

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Blank Page on Load

**Symptom**: App shows white screen

**Solution**:
1. Check browser console for errors
2. Verify `.env` file exists and has correct values
3. Check if backend is running (if required)

### Issue: Firebase Auth Errors

**Symptom**: Google sign-in fails

**Solution**:
1. Verify Firebase configuration in `.env`
2. Check Firebase Console for correct settings
3. Ensure `localhost:3000` is in authorized domains

### Issue: API Connection Refused

**Symptom**: Network errors in console

**Solution**:
1. Verify `REACT_APP_API_URL` is correct
2. Ensure backend server is running
3. Check for CORS configuration on backend

### Issue: Hot Reload Not Working

**Symptom**: Changes don't appear without manual refresh

**Solution**:
```bash
# Stop dev server and restart
Ctrl+C
npm start
```

### Issue: Port 3000 Already in Use

**Symptom**: "Something is already running on port 3000"

**Solution**:
```bash
# Option 1: Kill the process
npx kill-port 3000

# Option 2: Use different port
PORT=3001 npm start
```

### Issue: Redux DevTools Not Showing Data

**Symptom**: DevTools extension shows empty state

**Solution**:
1. Install Redux DevTools browser extension
2. Refresh the page after installation
3. Check that store is configured with DevTools middleware

---

## Next Steps

Now that you're set up, explore these resources:

1. **[Local Development Guide](local-development.md)** - Advanced development workflows
2. **[Architecture Documentation](../../ARCHITECTURE.md)** - Understand the system design
3. **[Contributing Guide](../../CONTRIBUTING.md)** - How to submit changes
4. **[Internal API Documentation](../api/internal-api.md)** - API reference

---

## Getting Help

- Check the [FAQ](../reference/faq.md)
- Search [existing issues](https://github.com/AI4Bharat/arena-frontend/issues)
- Open a new issue with:
  - Environment details (OS, Node version)
  - Steps to reproduce
  - Expected vs actual behavior
  - Error messages and screenshots