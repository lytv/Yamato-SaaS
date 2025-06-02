## Code Style and Conventions

The Yamato-SaaS project follows these coding conventions:

### TypeScript
- Strict type checking is enabled
- Types are defined in `src/types/` directory
- Type-safe environment variables with T3 Env

### Component Structure
- React functional components with hooks
- Shadcn UI component patterns
- Component-first design approach

### File Naming
- PascalCase for component files (e.g., `Button.tsx`)
- camelCase for utility files (e.g., `fetchData.ts`)
- Use `.tsx` extension for React components
- Use `.ts` extension for TypeScript files

### Styling
- Tailwind CSS for styling
- CSS modules when needed
- Consistent use of design tokens

### State Management
- React hooks for local state
- Context API for shared state when necessary
- Server components when appropriate

### Error Handling
- Consistent error boundaries
- Proper error logging with Sentry

### Testing
- Unit tests with Vitest
- Integration tests with Playwright
- Component tests with Storybook

### Code Quality
- ESLint with NextJS, NextJS Core Web Vitals, Tailwind CSS and Antfu configuration
- Prettier for code formatting
- Husky for Git hooks
- Lint-staged for running linters on Git staged files
- Commitlint for Git commit message linting
