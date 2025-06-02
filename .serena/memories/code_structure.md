## Code Structure

The Yamato-SaaS project follows a well-organized folder structure:

### Root Directories
- `src/`: Main source code
- `public/`: Static assets
- `migrations/`: Database migrations
- `tests/`: Test files

### Source Code Structure
- `src/app/`: Next.js App Router structure
  - `[locale]/`: Internationalization routing
  - `(auth)/`: Authenticated routes
  - `(unauth)/`: Unauthenticated routes
- `src/components/`: Reusable UI components
- `src/features/`: Feature-specific components
- `src/libs/`: Third-party library configurations
- `src/locales/`: Internationalization messages
- `src/models/`: Database schema definitions
- `src/styles/`: Global styles
- `src/templates/`: Page templates
- `src/types/`: TypeScript type definitions
- `src/utils/`: Utility functions

### Key Files
- `package.json`: Project dependencies and scripts
- `drizzle.config.ts`: Database configuration
- `next.config.mjs`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `.env` & `.env.production`: Environment variables
