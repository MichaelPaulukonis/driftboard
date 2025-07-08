# Monolithic Full-Stack Implementation Plan - DriftBoard

## Implementation Overview

This document outlines the implementation plan for DriftBoard using Approach #1: Monolithic Full-Stack with SQLite.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     Single Docker Container                    │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   React SPA     │  │   Express API   │  │     SQLite      │ │
│  │   (Built)       │◄─┤   + TypeScript  │◄─┤   + File-based  │ │
│  │   Static Files  │  │   + Prisma ORM  │  │   + WAL Mode    │ │
│  │                 │  │                 │  │                 │ │
│  │   Served by     │  │   Port: 8000    │  │   Volume Mount  │ │
│  │   Express       │  │   + Static      │  │   /data/app.db  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                │                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Firebase Auth (External)                   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + Redux Toolkit + RTK Query
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: SQLite with WAL mode
- **Authentication**: Firebase Auth
- **UI Components**: ShadCN/ui + Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Testing**: Vitest + React Testing Library + Playwright
- **Deployment**: Single Docker container

## Project Structure

```
driftboard/
├── src/
│   ├── frontend/          # React application
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # ShadCN/ui components
│   │   │   ├── board/    # Board-specific components
│   │   │   ├── card/     # Card components
│   │   │   └── common/   # Common components
│   │   ├── pages/        # Route components
│   │   ├── store/        # Redux store setup
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions
│   │   ├── types/        # TypeScript type definitions
│   │   └── api/          # RTK Query API definitions
│   ├── backend/          # Express server
│   │   ├── routes/       # API route handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Prisma models
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Backend utilities
│   │   └── types/        # Backend type definitions
│   └── shared/           # Shared types and utilities
├── prisma/              # Database schema and migrations
├── tests/               # Test files
│   ├── e2e/            # Playwright E2E tests
│   ├── integration/    # Integration tests
│   └── unit/           # Unit tests
├── docs/               # Documentation
├── docker/             # Docker configuration
└── public/             # Static assets
```

## Implementation Phases

### Phase 1: Project Foundation (Day 1)
1. Initialize project structure
2. Setup package.json with dependencies
3. Configure TypeScript for both frontend and backend
4. Setup Vite for frontend development
5. Configure ESLint and Prettier
6. Initialize Git repository

### Phase 2: Backend Core (Day 1-2)
1. Setup Express server with TypeScript
2. Configure Prisma with SQLite
3. Create database schema (User, Board, List, Card)
4. Setup Firebase Admin SDK for auth verification
5. Create basic API routes (CRUD operations)
6. Add error handling middleware

### Phase 3: Frontend Foundation (Day 2-3)
1. Setup React with Vite and TypeScript
2. Configure Redux Toolkit and RTK Query
3. Setup ShadCN/ui and Tailwind CSS
4. Create basic routing with React Router
5. Setup Firebase Auth on frontend
6. Create authentication context and guards

### Phase 4: Core Features (Day 3-5)
1. Implement board management (create, read, update, delete)
2. Implement list management within boards
3. Implement card management within lists
4. Setup drag-and-drop functionality with @dnd-kit
5. Create responsive UI components
6. Add form validation and error handling

### Phase 5: Testing & Polish (Day 5-7)
1. Write unit tests for critical functions
2. Setup integration tests for API endpoints
3. Create E2E tests with Playwright
4. Performance optimization
5. Documentation updates
6. Docker containerization

## Database Schema

```prisma
// prisma/schema.prisma
model User {
  id        String   @id
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  boards    Board[]
}

model Board {
  id          String    @id @default(cuid())
  name        String
  description String?
  userId      String
  position    Int
  archivedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lists       List[]
}

model List {
  id        String   @id @default(cuid())
  name      String
  boardId   String
  position  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards     Card[]
}

model Card {
  id          String    @id @default(cuid())
  title       String
  description String?
  listId      String
  position    Int
  dueDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  list        List      @relation(fields: [listId], references: [id], onDelete: Cascade)
  labels      Label[]
  activities  Activity[]
}

model Label {
  id     String @id @default(cuid())
  name   String
  color  String
  cardId String
  card   Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)
}

model Activity {
  id        String   @id @default(cuid())
  type      String   // 'comment', 'moved', 'edited', etc.
  content   String?
  cardId    String
  userId    String
  createdAt DateTime @default(now())
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

```
GET    /api/health              # Health check
POST   /api/auth/verify         # Verify Firebase token

GET    /api/boards              # Get user's boards
POST   /api/boards              # Create new board
GET    /api/boards/:id          # Get board with lists and cards
PUT    /api/boards/:id          # Update board
DELETE /api/boards/:id          # Delete board

POST   /api/boards/:id/lists    # Create list in board
PUT    /api/lists/:id           # Update list
DELETE /api/lists/:id           # Delete list

POST   /api/lists/:id/cards     # Create card in list
PUT    /api/cards/:id           # Update card
DELETE /api/cards/:id           # Delete card
POST   /api/cards/:id/move      # Move card between lists
```

## Key Dependencies

### Frontend
```json
{
  "@reduxjs/toolkit": "^2.0.1",
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "react": "^18.2.0",
  "react-redux": "^9.0.4",
  "react-router-dom": "^6.20.1",
  "firebase": "^10.7.1",
  "tailwindcss": "^3.3.6",
  "@radix-ui/react-dialog": "^1.0.5"
}
```

### Backend
```json
{
  "express": "^4.18.2",
  "prisma": "^5.7.1",
  "@prisma/client": "^5.7.1",
  "firebase-admin": "^12.0.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "compression": "^1.7.4"
}
```

### Development
```json
{
  "typescript": "^5.3.3",
  "vite": "^5.0.8",
  "vitest": "^1.0.4",
  "@playwright/test": "^1.40.1",
  "eslint": "^8.55.0",
  "prettier": "^3.1.1"
}
```

## Next Steps

1. Create project structure
2. Initialize package.json with all dependencies
3. Setup TypeScript configuration
4. Configure development tools (ESLint, Prettier)
5. Begin Phase 2 implementation

This plan prioritizes getting a working MVP as quickly as possible while maintaining code quality and following the established coding standards.
