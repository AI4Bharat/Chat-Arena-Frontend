# Chat Arena Frontend Documentation

Welcome to the Chat Arena Frontend documentation. This directory contains comprehensive technical documentation for developers working on the project.

## Documentation Structure

```
docs/
├── README.md                    # This file
├── architecture/
│   ├── system-overview.md       # High-level system architecture
│   └── decisions/               # Architecture Decision Records (ADRs)
│       ├── 0001-use-redux-toolkit-for-global-state.md
│       ├── 0002-use-react-query-for-server-cache.md
│       ├── 0003-feature-based-folder-structure.md
│       ├── 0004-use-tailwind-css.md
│       └── 0005-streaming-with-fetch-api.md
├── guides/
│   ├── getting-started.md       # Setup and first steps
│   └── local-development.md     # Development workflows
├── api/
│   └── internal-api.md          # Hooks, services, utilities
└── reference/
    ├── glossary.md              # Terminology definitions
    └── faq.md                   # Frequently asked questions
```

## Quick Links

### Getting Started

| Document | Description |
|----------|-------------|
| [Getting Started](guides/getting-started.md) | Prerequisites, setup, first run |
| [Local Development](guides/local-development.md) | Dev workflow, debugging, testing |

### Architecture

| Document | Description |
|----------|-------------|
| [System Overview](architecture/system-overview.md) | High-level architecture |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Detailed technical design |
| [ADRs](architecture/decisions/) | Key architectural decisions |

### Reference

| Document | Description |
|----------|-------------|
| [Internal API](api/internal-api.md) | Hooks, Redux, utilities |
| [Glossary](reference/glossary.md) | Terms and definitions |
| [FAQ](reference/faq.md) | Common questions |

### Contributing

| Document | Description |
|----------|-------------|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines |

## Documentation Guidelines

When adding new documentation:

1. **Location**: Place files in the appropriate subdirectory
2. **Format**: Use Markdown with consistent heading structure
3. **Cross-links**: Link to related documentation
4. **Diagrams**: Use Mermaid for diagrams (renders in GitHub)
5. **Examples**: Include code examples where helpful

## Updating Documentation

- Update docs when making significant code changes
- Keep the README current with structural changes
- Review ADRs when making architectural changes
- Add glossary entries for new terminology

## Feedback

Found an issue or have a suggestion? Please:
- Open an issue on GitHub
- Submit a PR with improvements
- Reach out to the maintainers