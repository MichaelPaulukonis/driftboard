# System Architecture Overview - DriftBoard

## Executive Summary

DriftBoard is a personal Kanban board application designed as a self-hosted, containerized solution for project management. The architecture prioritizes simplicity, learning opportunities, and cost-effectiveness while maintaining extensibility for future enhancements.

## High-Level Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Host                              │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Frontend      │  │    Backend      │  │    Database     │  │
│  │   Container     │  │   Container     │  │   Container     │  │
│  │                 │  │                 │  │                 │  │
│  │  React SPA      │  │  Node.js API    │  │   SQLite        │  │
│  │  + Vite         │  │  + Express      │  │   + Backups     │  │
│  │  + Redux        │◄─┤  + TypeScript   │◄─┤   + Volume      │  │
│  │  + TypeScript   │  │  + Auth         │  │     Mount       │  │
│  │                 │  │      Middleware |  │                 │  │
│  │  Port: 3000     │  │  Port: 8000     │  │  Volume:        │  │
│  └─────────────────┘  └─────────────────┘  │  /data/db       │  │
│           │                     │          └─────────────────┘  │
│           │                     │                               │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │   Nginx         │  │   Firebase      │                       │
│  │   Reverse       │  │   Auth Service  │                       │
│  │   Proxy         │  │   (External)    │                       │
│  │                 │  │                 │                       │
│  │  Port: 80/443   │  │  API Calls      │                       │
│  └─────────────────┘  └─────────────────┘                       │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Host Network                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

1. **Container-First Architecture**
   - Multi-container Docker setup with docker-compose
   - Each service isolated with clear boundaries
   - Volume mounting for data persistence

2. **API-First Design**
   - RESTful API backend with clear separation from frontend
   - JSON-based communication
   - Swagger/OpenAPI documentation

3. **Client-Side State Management**
   - Redux Toolkit for predictable state management
   - RTK Query for server state and caching
   - Optimistic updates for better UX

4. **Authentication-as-a-Service**
   - Firebase Auth for user management
   - JWT token-based API authentication
   - Minimal user data storage locally

## Technology Stack Justification

### Frontend Stack
- **React 18 + TypeScript**: Industry standard, large ecosystem, excellent learning value
- **Vite**: Fast development builds, modern tooling, better than Create React App
- **Redux Toolkit + RTK Query**: Predictable state management, built-in caching, DevTools
- **ShadCN/UI + Tailwind**: Modern, accessible components with utility-first CSS
- **@dnd-kit**: Modern, accessible drag-and-drop library

### Backend Stack
- **Node.js + Express + TypeScript**: Familiar ecosystem, rapid development
- **SQLite**: Zero-config database, perfect for single-user local deployment
- **Prisma ORM**: Type-safe database access, excellent TypeScript integration
- **Winston**: Structured logging for debugging and monitoring

### Infrastructure Stack
- **Docker + Docker Compose**: Consistent environments, easy deployment
- **Nginx**: Production-ready reverse proxy, SSL termination
- **Firebase Auth**: Zero-maintenance authentication, Google/GitHub login

### Testing Stack
- **Vitest**: Fast unit testing, native TypeScript support
- **React Testing Library**: Component testing best practices
- **Playwright**: End-to-end testing, cross-browser support
- **MSW**: API mocking for reliable frontend tests

## Core Architectural Principles

1. **Simplicity First**: Start simple, add complexity only when needed
2. **Container-Native**: Everything runs in containers for consistency
3. **Type Safety**: Full TypeScript coverage across frontend and backend
4. **Testability**: Components and APIs designed for easy testing
5. **Extensibility**: Clear separation of concerns for future features
6. **Developer Experience**: Fast feedback loops, good tooling, clear documentation

## Data Flow Architecture

```
┌─────────────┐    HTTP/REST    ┌─────────────┐    SQL/ORM    ┌─────────────┐
│   React     │ ◄─────────────► │   Express   │ ◄───────────► │   SQLite    │
│   Frontend  │    (Axios)      │   Backend   │   (Prisma)    │   Database  │
└─────────────┘                 └─────────────┘               └─────────────┘
      │                                │
      │         Firebase SDK           │
      ▼                                ▼
┌─────────────┐                 ┌─────────────┐
│  Firebase   │                 │   Winston   │
│  Auth       │                 │   Logging   │
└─────────────┘                 └─────────────┘
```

## Security Considerations

- **Authentication**: Firebase Auth handles all user credential management
- **Authorization**: JWT tokens validated on each API request
- **Data Isolation**: Single-user deployment reduces security complexity
- **Container Security**: Non-root users in containers, minimal attack surface
- **Local Network Only**: No external exposure by default (HTTPS for future public deployment)

## Development Environment

- **Hot Reloading**: Vite dev server + nodemon for backend
- **Type Checking**: Real-time TypeScript checking in IDE and build
- **Database Management**: Prisma Studio for database inspection
- **API Testing**: Built-in Swagger UI for API exploration
- **Container Development**: Docker Compose with development overrides
