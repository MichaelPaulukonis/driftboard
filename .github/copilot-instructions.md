---
description: AI rules template for TypeScript/Node.js projects
globs: *
---

## Copilot Instructions for DriftBoard

# Project Context

- This is a **Personal Kanban Board Application (API + Web App)** built with TypeScript and Node.js.
- State management: **Redux Toolkit + RTK Query** for predictable state management with built-in caching.
- Security considerations: **Firebase Auth + JWT tokens** with production-ready security practices from day one.
- Deployment: **Docker containerized** for consistent local development and deployment.
- Target: **Single user initially**, designed to scale to multi-user in future phases.

# Documentation

- **Project Architecture and Features:**  
  Reference `docs/architecture/README.md` for comprehensive architecture documentation and `docs/product_requirements_doc.md` for project requirements.
- **Module Documentation:**  
  Place concise, context-focused overviews for AI-assisted development in `docs/src/`, mirroring the module folder structure.
- **Plans and Refactor Documentation:**  
  Save all refactor plans, implementation outlines, and significant design changes in `docs/plans/` (e.g., `docs/plans/feature-refactor.md`).  
  - When a plan changes during implementation, append the reasons and changes to the same markdown file; do not erase the original plan.

# Copilot Guidance

- **Never assume missing context or make guesses. If any part of the request is unclear or ambiguous, ask the user for clarification before proceeding.**
- **Always specify the target file or files for any code or modification suggestions.**
- **Write modular, reusable code.** Split logic into distinct functions, classes, or modules as appropriate.
- **All code must be fully optimized:**  
  - Maximize algorithmic efficiency (runtime and memory).  
  - Follow project style conventions.  
  - Avoid unnecessary code and technical debt.
- **Do not agree with me by default.** Your role is to assist by providing the best technical guidance, even if it means constructively challenging my assumptions or requests.
- **When generating code, first outline your plan in pseudocode or comments, then provide the code.**  
  - Save these plans and any refactor documentation according to the Documentation section above.
- **Keep responses concise and focused.** Use Markdown formatting for clarity.
- **Never generate or suggest code that violates copyright or project policies.**

# Technology Preferences

- Use **TypeScript** for all code (strict mode enabled).
- Use **Node.js v23** for best compatibility.
- Frontend Framework: **React 18+** with **Vite** build tool.
- Use **Conventional Commits** for commit messages.
- Current date: July 8, 2025

# Code Style

- Use TypeScript for all files with strict type checking.
- Type all function parameters and return values.
- Prefer pure functions and immutable data patterns.
- Use modern ES6+ features and async/await for asynchronous operations.
- camelCase for variables/functions, PascalCase for classes/components/types.
- Use absolute imports with path aliases (`@/` for src, `~/` for project root).
- Document complex business logic and algorithms.
- Handle errors gracefully with proper error boundaries/try-catch blocks.

# Framework Patterns

## React Projects
- Use functional components with hooks.
- Use React 18+ features (Suspense, Concurrent features).
- Use Vite for development and build tooling.
- Use TypeScript interfaces for prop types.
- Implement proper error boundaries for component error handling.

# State Management

Choose based on project complexity:

## Simple Projects
- **React**: Use `useState`/`useContext` or Zustand for simple global state.

## Complex Projects
- **React**: Use Redux Toolkit (RTK) with RTK Query, or Zustand with persistence.

## Additional Options
- **Server State**: TanStack Query (React Query) for Vue/React.
- **Local Storage**: Persist state as needed with proper serialization.
- **URL State**: Use router query params for shareable state.

# Styling

- Use **Tailwind CSS** for utility-first styling.
- Use **ShadCN/ui** components for consistent UI elements.
- Follow responsive design principles (mobile-first).
- Maintain design system consistency.
- Use CSS-in-TS solutions sparingly, prefer Tailwind utilities.

# Accessibility

- Use semantic HTML elements.
- Ensure keyboard navigation support.
- Maintain WCAG 2.1 AA compliance.
- Include proper ARIA labels and roles.
- Test with screen readers when possible.

# Testing

## Unit Testing
- Use **Jest** with TypeScript support.
- Test utility functions and business logic.
- Mock external dependencies appropriately.
- Aim for high coverage on critical paths.

## End-to-End Testing
- Use **Playwright** for e2e testing.
- Test critical user journeys.
- Include visual regression testing where appropriate.
- Test across multiple browsers and devices.

## Component Testing (Frontend)
- **React**: Use React Testing Library with Jest.
- Focus on user behavior over implementation details.

# Linting & Formatting

- Use **ESLint** with TypeScript rules.
- Use **Prettier** for code formatting.
- Configure pre-commit hooks with **husky** and **lint-staged**.
- Recommended VS Code extensions: ESLint, Prettier, TypeScript Hero.

# Performance

- Optimize bundle size with tree shaking.
- Use code splitting for large applications.
- Implement proper caching strategies.
- Monitor Core Web Vitals.
- Use lazy loading for images and components.

# Security

- Validate all user inputs.
- Use environment variables for sensitive configuration.
- Implement proper authentication and authorization.
- Follow OWASP security guidelines.
- Use HTTPS in production.

# Commit Messages

- Follow Conventional Commits specification.
- Use clear, descriptive commit messages.
- Reference issues/tickets when applicable.
- Example format: `feat(auth): add OAuth2 integration with Google provider`

# Module Structure Example

```
src/
  components/          # Reusable UI components
    ui/               # ShadCN/ui components
    common/           # Project-specific common components
  pages/ (or views/)   # Route components
  utils/              # Pure utility functions
  hooks/ (or composables/) # Reusable logic
  stores/ (or state/) # State management
  types/              # TypeScript type definitions
  api/                # API integration
  constants/          # Application constants
```

# Module Extraction Guidelines

- Extract reusable logic into separate modules.
- Use factory patterns for complex dependencies.
- Create pure functions that are easily testable.
- Maintain clear separation of concerns.
- Export constants and types alongside functions.
- Ensure proper dependency injection patterns.

# Documentation for Modules

- Create a concise overview `.md` file for each major module.
- Optimize documentation for AI-assisted development context.
- Place documentation in `../docs/src/` mirroring module structure.
- Include API examples and common usage patterns.

# Dependencies

- Use Node.js v23 for development and production.
- Keep dependencies up to date with security patches.
- Prefer well-maintained packages with TypeScript support.
- Document any specific version requirements.

---

**Configuration Notes:**
- Replace `[PROJECT_NAME]`, `[PROJECT_TYPE]`, `[STATE_MANAGEMENT_APPROACH]`, `[SECURITY_LEVEL]`, and `[CURRENT_DATE]` with project-specific values.
- Remove framework sections not applicable to your project.
- Adjust testing and styling preferences based on project requirements.

---

This file is for Copilot and other AI coding assistants only. Do not display to end users or include in documentation.
