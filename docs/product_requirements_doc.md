# Personal Kanban Board - Product Requirements Document

## Executive Summary

A personal visual project management application to replace Trello, serving as both a cost-saving solution ($84/year) and a comprehensive technical learning exercise. The application will provide kanban-style boards, lists, and cards for organizing programming projects, artistic endeavors, and reading lists.

## Problem Statement & Vision

### Problem Statement
- **Cost Issue:** Trello's paid plan ($7/month) is required for more than 10 boards, but the user quickly exceeded the free tier limit
- **Workflow Gap:** Current reliance on Google Tasks lacks the visual organization and flexibility that Trello provides
- **Learning Opportunity:** Need hands-on experience with React, Firebase, Redux, and modern development practices

### Target Users
**Primary User:** The developer themselves - a software engineer managing:
- Large individual programming projects (PolychromeText, Job Posting Analyzer)
- Collections of smaller projects (Generative Art Apps)
- Article reading lists and research triage
- Career development tasks and learning goals

### Vision
Create a personal, self-hosted kanban application that provides Trello-like functionality without subscription costs, while serving as a comprehensive learning platform for modern web development technologies.

## Core Features & Requirements

### MVP Features (Week 1)
**Critical for launch:**
- User authentication (Firebase Auth)
- Create, read, update, delete boards
- Create, read, update, delete lists within boards
- Create, read, update, delete cards within lists
- Drag-and-drop functionality for cards between lists
- Basic card editing (title, description)
- Responsive design for desktop use

### Phase 2 Features (Weeks 2-8)
**Very nice to have:**
- Card metadata: labels, due dates, checklists
- Timestamped activity history on cards
- Basic Markdown support in descriptions and comments
- Cross-card linking capabilities
- File attachments in card comments
- Search functionality across boards and cards
- Board archiving system

### Future Features (Phase 3+)
- Import from Google Tasks and Trello
- Chrome extension for "Send to Board" functionality
- List templates and board templates
- Advanced filtering and sorting
- Bulk operations
- Export capabilities

## Technical Architecture

### Tech Stack
- **Frontend:** Vite + React 18 + TypeScript
- **State Management:** Redux Toolkit + RTK Query
- **Styling:** ShadCN/UI + Tailwind CSS
- **Authentication:** Firebase Auth
- **Database:** SQLite (local file-based for MVP)
- **Drag & Drop:** @dnd-kit library
- **Testing:** Vitest + React Testing Library + Playwright (basic E2E)
- **Containerization:** Docker with multiple containers

### Architecture Decisions
- **Local-only deployment:** No remote server required for MVP
- **File-based database:** SQLite for simplicity and local storage
- **Component-driven development:** ShadCN for consistent, accessible UI
- **Type safety:** Full TypeScript implementation
- **Modern React patterns:** Hooks, function components, strict mode

### Data Model
```
User (Firebase Auth)
├── Boards[]
    ├── id, name, description, createdAt, archivedAt?
    ├── Lists[]
        ├── id, name, position, boardId
        ├── Cards[]
            ├── id, title, description, position, listId
            ├── labels[], dueDate?, createdAt, updatedAt
            ├── Activities[] (comments, history)
            └── Checklists[]
```

## Success Metrics & Goals

### Success Criteria
1. **Cost Savings:** Successfully cancel Trello subscription ($84/year saved)
2. **Workflow Migration:** Migrate all Google Tasks reading lists to the new tool
3. **Technical Mastery:** Demonstrate proficiency with React, Firebase, Redux, and Docker

### Learning Goals
- **React Ecosystem:** Transition from Vue/Nuxt expertise to React proficiency
- **Firebase Integration:** First hands-on experience with Firebase services
- **State Management:** Apply Redux in a personal project context
- **Container Orchestration:** Learn Docker multi-container deployment
- **Chrome Extension Development:** Foundation for future browser extension
- **Modern Testing:** Implement Playwright E2E testing workflows

### Timeline & Milestones

**Week 1 (MVP):**
- [ ] Project setup with Vite + React + TypeScript
- [ ] Firebase Auth integration
- [ ] Basic CRUD for boards, lists, and cards
- [ ] Drag-and-drop functionality
- [ ] SQLite database setup
- [ ] Basic E2E test with Playwright

**Month 1-2 (Full Feature Set):**
- [ ] Card metadata and activity tracking
- [ ] Markdown support and cross-linking
- [ ] Search functionality
- [ ] Board archiving
- [ ] Comprehensive test suite
- [ ] Docker containerization

**Future Phases:**
- [ ] Data import tools
- [ ] Chrome extension
- [ ] CI/CD pipeline
- [ ] Public deployment consideration

## Risk Assessment & Mitigation

### Technical Risks
- **React Learning Curve:** Mitigate with AI-assisted development and comprehensive documentation
- **Integration Complexity:** Start with Firebase Auth only, add Firestore later if needed
- **Drag-and-Drop Implementation:** Use proven library (@dnd-kit) rather than custom solution

### Scope Risks
- **Feature Creep:** Strict adherence to MVP definition, features tracked in future phases
- **Over-Engineering:** SQLite and local deployment for simplicity
- **Timeline Pressure:** AI assistance expected to accelerate development significantly

## Dependencies & Constraints

### External Dependencies
- Firebase (auth services)
- Modern browser with JavaScript enabled
- Docker for containerization
- Node.js development environment

### Constraints
- **Single User:** No multi-user features required
- **Local Only:** No cloud deployment for MVP
- **Desktop First:** Mobile responsiveness nice-to-have
- **Cost Sensitivity:** Prefer free/open-source solutions

---

## Next Steps
1. Set up development environment with Vite + React + TypeScript
2. Configure Firebase project and authentication
3. Implement basic board/list/card data structures
4. Build core CRUD operations
5. Integrate drag-and-drop functionality
6. Add basic styling with ShadCN components
7. Implement SQLite persistence layer
8. Create minimal E2E test suite