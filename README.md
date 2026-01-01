# Chat Arena Frontend

A modern React-based AI model evaluation platform that enables users to interact with various AI models, compare responses side-by-side, and contribute to model rankings through structured feedback.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.9-764ABC?logo=redux)](https://redux-toolkit.js.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.9-FF4154)](https://tanstack.com/query)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

Chat Arena is an AI model comparison and evaluation platform developed by AI4Bharat. Users can:
- Chat directly with AI models
- Compare multiple models side-by-side
- Participate in blind testing to rank models
- Provide structured feedback across multiple categories
- View community-driven model leaderboards

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | React 19.2, React Router 7.9 |
| **State Management** | Redux Toolkit 2.9, React Query 5.9 |
| **Styling** | Tailwind CSS 3.x, Emotion, Framer Motion |
| **Authentication** | Firebase (Google OAuth) |
| **HTTP Client** | Axios with interceptors |
| **Real-time** | Fetch Streaming (SSE), Socket.io-client |
| **UI Components** | Material-UI 7.3, Lucide React |
| **Content** | React Markdown, React Syntax Highlighter |
| **Build** | Create React App |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API server (default: `http://localhost:8000`)
- Firebase project (for Google OAuth)

### Installation

```bash
# Clone the repository
git clone https://github.com/AI4Bharat/arena-frontend.git
cd arena-frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

The application will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Features

### Chat Modes

| Mode | Description |
|------|-------------|
| **Direct** | Chat with a single selected AI model |
| **Compare** | Side-by-side comparison of two models |
| **Random/Blind** | Anonymous model comparison for unbiased evaluation |

### Key Capabilities

- **Real-time Streaming**: Watch responses generate in real-time with SSE streaming
- **Message Branching**: Create conversation branches to explore different paths
- **Response Regeneration**: Regenerate any AI response for comparison
- **Session Management**: Organize conversations into sessions with auto-generated titles
- **Sharing & Export**: Share conversations via link or export as JSON
- **Feedback System**: Rate responses across categories (Overall, Creative Writing, Coding, Reasoning)
- **Model Leaderboard**: View community-driven rankings with time-based filters
- **Indic Language Support**: Built-in support for Indian languages via AI4Bharat transliteration

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture and design patterns |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines and PR process |
| [docs/guides/getting-started.md](docs/guides/getting-started.md) | Detailed setup and first steps |
| [docs/guides/local-development.md](docs/guides/local-development.md) | Development workflow and debugging |
| [docs/api/internal-api.md](docs/api/internal-api.md) | Internal API documentation |
| [docs/architecture/](docs/architecture/) | Architecture decision records |

## Project Structure

```
src/
├── app/                    # Core app configuration
│   ├── store.js           # Redux store setup
│   ├── router.jsx         # Route definitions
│   └── queryClient.js     # React Query configuration
├── features/              # Feature-based modules
│   ├── auth/              # Authentication (Google OAuth, anonymous)
│   ├── chat/              # Chat interface and streaming
│   ├── leaderboard/       # Model rankings
│   ├── models/            # Model management
│   └── legal/             # Privacy, Terms, Maintenance pages
├── shared/                # Shared utilities
│   ├── api/               # Axios client and endpoints
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
└── styles/                # Global styles and animations
```

## Available Scripts

```bash
npm start          # Start development server
npm run build      # Create production build
npm test           # Run test suite
npm run eject      # Eject from CRA (one-way operation)
```

## Browser Support

| Browser | Supported Versions |
|---------|-------------------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code style guidelines
- Branch naming conventions
- PR process and review checklist
- Testing requirements

## Related Projects

- [Chat Arena Backend](https://github.com/AI4Bharat/arena-backend) - Django REST API backend
- [AI4Bharat](https://ai4bharat.org/) - Organization homepage

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [AI4Bharat](https://ai4bharat.org/) for Indic language support
- [TanStack](https://tanstack.com/) for React Query
- [Vercel](https://vercel.com/) for hosting infrastructure
