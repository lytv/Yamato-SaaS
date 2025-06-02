## Task Completion Guidelines

When completing a task in the Yamato-SaaS project, follow these steps:

### 1. Code Quality Checks
- Run TypeScript type checking: `npm run check-types`
- Run ESLint: `npm run lint`
- Fix ESLint issues: `npm run lint:fix`

### 2. Testing
- Write and run unit tests: `npm run test`
- For UI components, update Storybook stories if needed
- For critical features, add E2E tests: `npm run test:e2e`

### 3. Database Changes
- If you've modified the database schema in `src/models/Schema.ts`, generate a new migration: `npm run db:generate`

### 4. Internationalization
- Ensure all user-facing strings are internationalized using the `useTranslations` hook
- Add new translation keys to the locale files in `src/locales/`

### 5. Commit Changes
- Use the standardized commit format with: `npm run commit`
- This ensures proper versioning and changelog generation

### 6. Documentation
- Update documentation if needed
- Add comments for complex logic

### 7. Deployment
- The project is deployed automatically through GitHub Actions when changes are pushed to the main branch
- Make sure all tests pass before merging to main
