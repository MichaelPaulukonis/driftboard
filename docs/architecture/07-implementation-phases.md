# Implementation Phases - DriftBoard

## Overview

This document outlines a phased approach to implementing DriftBoard, breaking down the architecture into manageable development phases while maintaining clear dependencies and MVP considerations.

## Phase 1: MVP Foundation (Week 1-2)

### Objectives
- Basic kanban functionality working end-to-end
- User authentication implemented
- Docker containerization complete
- Core CRUD operations functional

### User Stories
- ✅ As a user, I can sign in with Google/GitHub via Firebase Auth
- ✅ As a user, I can create, view, edit, and delete boards
- ✅ As a user, I can create, view, edit, and delete lists within boards
- ✅ As a user, I can create, view, edit, and delete cards within lists
- ✅ As a user, I can drag and drop cards between lists
- ✅ As a user, I can access the app via Docker container

### Technical Implementation

#### Project Setup
```bash
# Day 1: Project scaffolding
mkdir driftboard && cd driftboard
mkdir frontend backend docker docs

# Frontend setup
cd frontend
npm create vite@latest . -- --template react-ts
npm install @reduxjs/toolkit react-redux @dnd-kit/core @dnd-kit/sortable
npm install firebase axios react-router-dom
npm install -D tailwindcss @shadcn/ui

# Backend setup
cd ../backend
npm init -y
npm install express prisma @prisma/client
npm install firebase-admin cors helmet express-rate-limit
npm install -D typescript @types/express @types/node tsx nodemon

# Initialize Prisma
npx prisma init --datasource-provider sqlite
```

#### Database Schema (Initial)
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(uuid())
  firebaseId String   @unique
  email      String   @unique
  name       String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  boards Board[]

  @@map("users")
}

model Board {
  id          String   @id @default(uuid())
  name        String
  description String?
  color       String?
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lists  List[]

  @@map("boards")
}

model List {
  id        String   @id @default(uuid())
  name      String
  position  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  boardId String
  board   Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards   Card[]

  @@map("lists")
}

model Card {
  id          String   @id @default(uuid())
  title       String
  description String?
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  listId String
  list   List   @relation(fields: [listId], references: [id], onDelete: Cascade)

  @@map("cards")
}
```

#### Frontend Core Components
```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { boardsApi } from './api/boardsApi';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    [boardsApi.reducerPath]: boardsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(boardsApi.middleware),
});

// src/components/Board/BoardView.tsx
export const BoardView: React.FC<{ boardId: string }> = ({ boardId }) => {
  const { data: board, isLoading } = useGetBoardQuery(boardId);
  
  if (isLoading) return <div>Loading...</div>;
  if (!board) return <div>Board not found</div>;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto">
        {board.lists.map((list) => (
          <ListComponent key={list.id} list={list} />
        ))}
        <AddListButton boardId={boardId} />
      </div>
    </DndContext>
  );
};
```

#### Backend API Structure
```typescript
// src/routes/boards.ts
export const boardsRouter = Router();

boardsRouter.get('/', authMiddleware, async (req, res) => {
  const boards = await prisma.board.findMany({
    where: { userId: req.user!.dbId },
    include: {
      lists: {
        include: { cards: true },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { position: 'asc' },
  });
  res.json(boards);
});

boardsRouter.post('/', authMiddleware, validateRequest(CreateBoardSchema), async (req, res) => {
  const board = await prisma.board.create({
    data: {
      ...req.body,
      userId: req.user!.dbId,
    },
  });
  res.status(201).json(board);
});
```

#### Docker Configuration
```dockerfile
# Dockerfile (Monolithic approach)
FROM node:23-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:23-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

FROM node:23-alpine AS runtime
RUN addgroup -g 1001 -S nodejs && adduser -S driftboard -u 1001
WORKDIR /app

# Copy backend
COPY --from=backend-builder --chown=driftboard:nodejs /app/backend/dist ./dist
COPY --from=backend-builder --chown=driftboard:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=driftboard:nodejs /app/backend/prisma ./prisma

# Copy frontend build
COPY --from=frontend-builder --chown=driftboard:nodejs /app/frontend/dist ./public

USER driftboard
EXPOSE 8000
CMD ["node", "dist/index.js"]
```

### Success Criteria
- [ ] User can sign in and see their dashboard
- [ ] User can create a board and see it in the list
- [ ] User can create lists and cards
- [ ] Drag and drop works between lists
- [ ] App runs in Docker container
- [ ] Data persists between container restarts

### Dependencies Complete
- Firebase project setup and configuration
- Basic CI/CD pipeline (optional but recommended)
- Domain name setup for Firebase auth (localhost OK for MVP)

## Phase 2: Enhanced Functionality (Week 3-4)

### Objectives
- Rich card editing capabilities
- Activity tracking and history
- Search and filtering
- Improved UI/UX with ShadCN components

### User Stories
- ✅ As a user, I can add descriptions to cards with Markdown support
- ✅ As a user, I can set due dates on cards
- ✅ As a user, I can add labels to cards for categorization
- ✅ As a user, I can see activity history on cards
- ✅ As a user, I can search across all boards and cards
- ✅ As a user, I can archive boards and cards

### Technical Implementation

#### Enhanced Database Schema
```prisma
// Add to existing schema.prisma
model Card {
  id          String    @id @default(uuid())
  title       String
  description String?
  position    Int       @default(0)
  dueDate     DateTime?
  archived    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  listId String
  list   List   @relation(fields: [listId], references: [id], onDelete: Cascade)

  labels     Label[]
  comments   Comment[]
  activities Activity[]

  @@map("cards")
}

model Label {
  id    String @id @default(uuid())
  name  String
  color String

  cardId String
  card   Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@map("labels")
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())

  cardId String
  card   Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@map("comments")
}

model Activity {
  id        String   @id @default(uuid())
  type      String   // 'created', 'moved', 'updated', 'commented'
  data      String   // JSON data about the activity
  createdAt DateTime @default(now())

  cardId String
  card   Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@map("activities")
}
```

#### Rich Card Editor
```typescript
// src/components/Card/CardEditModal.tsx
export const CardEditModal: React.FC<{ cardId: string; isOpen: boolean }> = ({
  cardId,
  isOpen,
}) => {
  const { data: card } = useGetCardQuery(cardId);
  const [updateCard] = useUpdateCardMutation();

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-4xl">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <CardTitleEditor card={card} onUpdate={updateCard} />
            <MarkdownEditor
              content={card?.description || ''}
              onChange={(description) => updateCard({ id: cardId, description })}
            />
            <CommentsList cardId={cardId} />
          </div>
          <div className="space-y-4">
            <DueDatePicker card={card} onUpdate={updateCard} />
            <LabelsEditor card={card} onUpdate={updateCard} />
            <ActivityHistory cardId={cardId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

#### Search Implementation
```typescript
// Backend: Full-text search
export const searchRouter = Router();

searchRouter.get('/cards', authMiddleware, async (req, res) => {
  const { q } = req.query;
  
  const cards = await prisma.card.findMany({
    where: {
      list: {
        board: {
          userId: req.user!.dbId,
        },
      },
      OR: [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
      ],
    },
    include: {
      list: {
        include: { board: true },
      },
      labels: true,
    },
  });

  res.json(cards);
});

// Frontend: Search component
export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const { data: results } = useSearchCardsQuery(query, { skip: query.length < 2 });

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        placeholder="Search cards..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {results?.map((card) => (
          <CommandItem key={card.id} onSelect={() => openCard(card.id)}>
            {card.title} - {card.list.board.name}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
};
```

### Success Criteria
- [ ] Rich card editing modal with markdown support
- [ ] Due dates can be set and are visually indicated
- [ ] Labels can be created and applied to cards
- [ ] Activity history shows card changes
- [ ] Search finds cards across all boards
- [ ] UI uses ShadCN components consistently

## Phase 3: Production Polish (Week 5-6)

### Objectives
- Comprehensive testing suite
- Performance optimizations
- Error handling and user feedback
- Data import/export capabilities

### Technical Implementation

#### Testing Suite
```typescript
// Frontend: Component testing
// src/components/Card/__tests__/Card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Card } from '../Card';

describe('Card Component', () => {
  it('renders card title and description', () => {
    const mockCard = {
      id: '1',
      title: 'Test Card',
      description: 'Test Description',
    };

    render(
      <Provider store={mockStore}>
        <Card card={mockCard} />
      </Provider>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('handles drag and drop', async () => {
    // Test drag and drop functionality
  });
});

// Backend: API testing
// src/routes/__tests__/boards.test.ts
describe('Boards API', () => {
  it('creates a new board', async () => {
    const response = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: 'Test Board',
        description: 'Test Description',
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Test Board');
  });
});

// E2E Testing with Playwright
// tests/board-management.spec.ts
test('complete board workflow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="create-board"]');
  await page.fill('[data-testid="board-name"]', 'Test Board');
  await page.click('[data-testid="save-board"]');
  
  // Verify board was created
  await expect(page.locator('text=Test Board')).toBeVisible();
});
```

#### Performance Optimizations
```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

export const VirtualizedCardList: React.FC<{ cards: Card[] }> = ({ cards }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <Card card={cards[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={cards.length}
      itemSize={80}
    >
      {Row}
    </List>
  );
};

// Optimistic updates
export const useOptimisticCardUpdate = () => {
  const [updateCard] = useUpdateCardMutation();
  
  return useCallback(async (cardId: string, updates: Partial<Card>) => {
    // Optimistically update UI
    dispatch(cardUpdated({ id: cardId, changes: updates }));
    
    try {
      await updateCard({ id: cardId, ...updates }).unwrap();
    } catch (error) {
      // Revert optimistic update
      dispatch(cardUpdateReverted(cardId));
      throw error;
    }
  }, [updateCard, dispatch]);
};
```

#### Error Handling
```typescript
// Global error boundary
export class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

// API error handling
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('API Error', error);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details,
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: 'Resource not found',
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message }),
  });
};
```

### Success Criteria
- [ ] 80%+ test coverage on core functionality
- [ ] App handles network errors gracefully
- [ ] Performance remains smooth with 100+ cards
- [ ] Users can export their data as JSON
- [ ] Error boundaries prevent app crashes

## Phase 4: Future Enhancements (Month 2+)

### Objectives
- Multi-user support preparation
- Advanced features implementation
- Performance monitoring
- Chrome extension foundation

### Technical Implementation

#### Multi-User Database Schema
```prisma
model Board {
  id          String   @id @default(uuid())
  name        String
  description String?
  visibility  Visibility @default(PRIVATE) // PUBLIC, PRIVATE, TEAM
  
  ownerId     String
  owner       User     @relation("OwnedBoards", fields: [ownerId], references: [id])
  members     BoardMember[]
  
  // ... existing fields
}

model BoardMember {
  id         String     @id @default(uuid())
  role       BoardRole  @default(VIEWER) // VIEWER, EDITOR, ADMIN
  invitedAt  DateTime   @default(now())
  acceptedAt DateTime?

  boardId    String
  board      Board      @relation(fields: [boardId], references: [id])
  userId     String
  user       User       @relation(fields: [userId], references: [id])

  @@unique([boardId, userId])
  @@map("board_members")
}

enum Visibility {
  PUBLIC
  PRIVATE
  TEAM
}

enum BoardRole {
  VIEWER
  EDITOR
  ADMIN
}
```

#### Real-time Updates
```typescript
// WebSocket implementation
import { Server } from 'socket.io';

export const setupWebSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = await verifyFirebaseToken(token);
      socket.userId = user.uid;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-board', (boardId) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('card-updated', (data) => {
      socket.to(`board:${data.boardId}`).emit('card-updated', data);
    });
  });
};

// Frontend WebSocket hook
export const useWebSocket = (boardId: string) => {
  const socket = useRef<Socket>();
  
  useEffect(() => {
    socket.current = io(process.env.VITE_WS_URL, {
      auth: { token: await getAuthToken() },
    });

    socket.current.emit('join-board', boardId);
    
    socket.current.on('card-updated', (data) => {
      dispatch(cardUpdated(data));
    });

    return () => socket.current?.disconnect();
  }, [boardId]);
};
```

#### Chrome Extension Foundation
```typescript
// manifest.json
{
  "manifest_version": 3,
  "name": "DriftBoard",
  "version": "1.0",
  "permissions": ["activeTab", "storage"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}

// popup.tsx
export const Popup: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  
  useEffect(() => {
    // Load user's boards
    api.get('/boards').then(setBoards);
  }, []);

  const saveCurrentPage = async (boardId: string, listId: string) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await api.post('/cards', {
      title: tab.title,
      description: `[${tab.title}](${tab.url})`,
      listId,
    });
  };

  return (
    <div className="w-80 p-4">
      <h2>Save to DriftBoard</h2>
      {boards.map(board => (
        <BoardSelector 
          key={board.id} 
          board={board} 
          onSave={saveCurrentPage} 
        />
      ))}
    </div>
  );
};
```

### Success Criteria
- [ ] Database schema supports multi-user features
- [ ] Real-time updates work across multiple browser sessions
- [ ] Chrome extension can save pages to boards
- [ ] Performance monitoring dashboard shows key metrics

## Dependencies and Critical Path

### Critical Path Analysis
```
Project Setup (1 day)
    ↓
Firebase Configuration (1 day)
    ↓
Database Schema (1 day)
    ↓
Authentication (2 days)
    ↓
Basic CRUD API (3 days)
    ↓
Frontend Components (3 days)
    ↓ 
Drag & Drop (2 days)
    ↓
Docker Setup (1 day)
    ↓
Integration Testing (1 day)
```

### Parallel Development Tracks

#### Track 1: Backend API
- Day 1-2: Project setup + Firebase
- Day 3-4: Database schema + basic CRUD
- Day 5-7: Authentication + authorization
- Day 8-9: Advanced features (search, activities)

#### Track 2: Frontend Components
- Day 1-2: React setup + routing
- Day 3-4: Authentication flow
- Day 5-7: Board/List/Card components
- Day 8-9: Drag & drop + UI polish

#### Track 3: DevOps & Testing
- Day 7-8: Docker setup
- Day 9-10: Testing suite
- Day 11-12: Deployment automation

### Risk Mitigation

#### Technical Risks
1. **Drag & Drop Complexity**
   - Mitigation: Use proven library (@dnd-kit)
   - Fallback: Manual move buttons

2. **Firebase Integration Issues**
   - Mitigation: Start with simple email/password auth
   - Fallback: JWT-only authentication

3. **Docker Configuration Problems**
   - Mitigation: Test locally before deployment
   - Fallback: Direct Node.js deployment

#### Scope Risks
1. **Feature Creep**
   - Mitigation: Strict MVP definition
   - Process: Feature freeze after Phase 1 complete

2. **Over-Engineering**
   - Mitigation: Regular architecture reviews
   - Principle: Choose simplest solution that works

## Success Metrics

### Phase 1 Metrics
- ✅ User can complete full workflow (create board → list → card → move card) in <2 minutes
- ✅ App loads in <3 seconds on initial visit
- ✅ Zero authentication errors in testing
- ✅ 100% core API endpoints working

### Phase 2 Metrics
- ✅ Search returns results in <500ms
- ✅ Card editing modal loads in <1 second
- ✅ All UI components use consistent design system
- ✅ Activity history captures 100% of user actions

### Phase 3 Metrics
- ✅ >80% test coverage
- ✅ Zero unhandled exceptions in production logs
- ✅ App remains responsive with 100+ cards per board
- ✅ Data export/import functions correctly

### Phase 4 Metrics
- ✅ Real-time updates propagate in <1 second
- ✅ Chrome extension saves pages successfully
- ✅ Multi-user permissions work correctly
- ✅ Performance metrics dashboard functional

This phased approach ensures steady progress while maintaining flexibility to adjust based on learning and changing requirements. Each phase builds upon the previous while delivering incremental value to the user.
