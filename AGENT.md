# Agent Guidelines

This document provides guidelines for AI coding agents working on this codebase.

## Project Overview

This is a Jira-style Kanban board application for managing coding agents, built with:
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main page
│   └── globals.css      # Global styles
├── components/          # React components
│   ├── KanbanBoard.tsx  # Main board component
│   ├── TaskItem.tsx     # Individual task cards
│   └── AgentSelector.tsx # Agent selection UI
├── hooks/               # Custom React hooks
│   ├── useAgents.ts     # Agent state management
│   └── useTasks.ts      # Task state management
├── lib/                 # Utility libraries
│   ├── storage.ts       # Local storage utilities
│   └── utils.ts         # General utilities
└── types/               # TypeScript type definitions
    ├── agent.ts         # Agent types
    └── task.ts          # Task types
```

## Development Workflow

### Before Making Changes

1. **Read relevant files first** - Understand existing code before modifying
2. **Check types** - Review type definitions in `src/types/` to understand data structures
3. **Follow existing patterns** - Match the coding style and patterns already in use

### Running the Project

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm test             # Run tests (when available)
```

### Code Quality Requirements

All code must pass the following checks before merging:

1. **Linting** - `npm run lint` must pass with no errors
2. **Build** - `npm run build` must complete successfully
3. **Tests** - All tests must pass (when tests are added)

### Making Changes

1. **Create a feature branch** - Branch from `main` for new features/fixes
2. **Keep changes focused** - One feature/fix per PR
3. **Write descriptive commit messages** - Explain what and why
4. **Test your changes** - Verify the app works after modifications

### Component Guidelines

- Use functional components with hooks
- Define prop types using TypeScript interfaces
- Keep components small and focused
- Extract reusable logic into custom hooks

### Styling Guidelines

- Use Tailwind CSS utility classes
- Use `clsx` for conditional class names
- Follow existing color scheme and spacing patterns
- Ensure responsive design (mobile-first approach)

### State Management

- Use React hooks (`useState`, `useEffect`, `useCallback`)
- Custom hooks in `src/hooks/` for shared state logic
- Local storage for persistence (via `src/lib/storage.ts`)

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code passes linting (`npm run lint`)
- [ ] Application builds successfully (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Changes have been manually tested
- [ ] No console errors or warnings
- [ ] TypeScript types are properly defined
- [ ] Code follows existing patterns and conventions

## CI/CD

This project uses GitHub Actions for continuous integration. The CI pipeline runs on every pull request to `main` and includes:

1. Dependency installation
2. Linting checks
3. Production build verification
4. Test execution

All checks must pass before a PR can be merged.
