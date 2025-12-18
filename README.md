# DriftBoard - Personal Kanban Board Application

A modern, self-hosted personal kanban board application built with React, TypeScript, Node.js, and SQLite. Designed as a cost-effective alternative to Trello with a focus on simplicity and learning modern web development practices.

## 🚀 Features

### MVP Features (Completed)
- ✅ **User Authentication** - Mock authentication for development (Firebase integration planned)
- ✅ **Board Management** - Create, read, update, delete boards
- ✅ **List Management** - Create and manage lists within boards
- ✅ **Card Management** - Create and manage cards within lists
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **SQLite Database** - Local file-based storage with Prisma ORM
- ✅ **REST API** - Full CRUD operations with TypeScript
- ✅ **Modern UI** - Built with Tailwind CSS and React 18

### Planned Features (Phase 2)
- 🔄 **Drag & Drop** - Move cards between lists with @dnd-kit
- 🔄 **Card Metadata** - Labels, due dates, checklists
- 🔄 **Activity History** - Track changes and comments
- 🔄 **Markdown Support** - Rich text descriptions
- 🔄 **Search** - Find cards and boards quickly
- 🔄 **Firebase Auth** - Proper user authentication

## 🏗️ Architecture

This application utilizes a multi-container architecture orchestrated by Docker Compose to create a robust and scalable development environment that mirrors a production setup. This approach separates the frontend, backend, and other services into distinct containers.

The key services are:
-   **Nginx:** Serves the static React frontend application and acts as a reverse proxy, directing API requests to the backend service.
-   **Backend:** A Node.js/Express container that runs the application's REST API and communicates with the database.
-   **Backup:** A utility container responsible for performing periodic backups of the database.

For a complete overview and detailed diagrams of the system, please refer to the [**Architecture Documentation](./docs/architecture/01-system-overview.md)**.

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + Redux Toolkit + RTK Query
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: SQLite with WAL mode
- **UI**: Tailwind CSS + Radix UI components
- **Authentication**: Firebase Auth (planned) / Mock auth (current)
- **Testing**: Vitest + React Testing Library + Playwright
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd driftboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd src/backend && npm install
   cd ../frontend && npm install
   cd ../..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd src/backend && npm run dev

   # Terminal 2: Frontend
   cd src/frontend && npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8000/api
- Modern tech stack implementation as a learning experience

## 🏗️ Architecture

- **Frontend**: React 18+ with TypeScript and Vite
- **Backend**: Node.js API with TypeScript
- **Database**: PostgreSQL with type-safe queries
- **State Management**: Redux Toolkit with RTK Query
- **Authentication**: Firebase Auth with JWT tokens
- **Deployment**: Docker containerized for consistent development and deployment

## 📚 Documentation

- [Product Requirements](./docs/product_requirements_doc.md) - Complete feature specifications and user stories
- [Architecture Documentation](./docs/architecture/README.md) - System design and technical decisions
- [Development Setup](./docs/development-setup.md) - Getting started guide (coming soon)

### Shared Boards

- Overview: Collaboration via `BoardMembership` and roles (`OWNER`, `EDITOR`)
- PRD: [Shared Boards Feature](./docs/plans/19.shared-boards-feature.md)
- Auth Strategy: [Role-Based Access](./docs/auth-strategy-overview.md)
- Implementation: [schema.prisma](./prisma/schema.prisma), routers [boards](./src/backend/routes/boards.ts), [lists](./src/backend/routes/lists.ts), [cards](./src/backend/routes/cards.ts)

## 🎯 Current Status

**Phase**: Initial architecture design and documentation
**Target**: Single-user MVP with multi-user scalability considerations

## 🛠️ Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- ShadCN/ui for component library
- Redux Toolkit for state management

### Backend
- Node.js v23 with TypeScript
- Express.js API framework
- PostgreSQL database
- JWT authentication
- Docker containerization

### Development
- ESLint + Prettier for code quality
- Jest + Playwright for testing
- Conventional Commits
- GitHub Actions for CI/CD (planned)

## 🎨 Design Principles

- **Type Safety**: Full TypeScript implementation with strict mode
- **Performance**: Optimized for speed and efficiency
- **Modularity**: Clean, reusable code architecture
- **Security**: Production-ready security practices from day one
- **Scalability**: Designed to grow from single-user to multi-user

## ⚙️ Environment Variables & Vite Symlink Setup

DriftBoard uses a single `.env` file in the project root for all configuration, including both frontend and backend variables. However, Vite (used for the frontend) only loads environment variables from an `.env` file in the `src/frontend` directory.

**Symlink Solution:**
To avoid duplicating config files, a symlink is created:

```sh
ln -s ../../.env src/frontend/.env
```

This ensures Vite can access the correct environment variables while keeping configuration centralized.

**Best Practice Note:**
For long-term maintainability, consider splitting frontend and backend config into separate `.env` files (e.g., `.env.frontend`, `.env.backend`). For now, the symlink approach is pragmatic and keeps config management simple.

If you change environment variables, restart the dev server to reload them.

## 📝 License

MIT License - This is a personal learning project

## 🤝 Contributing

This is primarily a personal learning project, but feedback and suggestions are welcome through issues.

---

**Note**: This project is part of a comprehensive learning journey in modern web development. Documentation and implementation details will be updated as development progresses.
