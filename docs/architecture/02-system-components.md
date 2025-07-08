# System Components Architecture - DriftBoard

## Frontend Architecture

### Component Hierarchy
```
App (Authentication Provider)
├── AuthGuard
│   ├── AppLayout (Header, Sidebar, Main)
│   │   ├── BoardsList (Dashboard)
│   │   ├── BoardView
│   │   │   ├── BoardHeader
│   │   │   ├── ListContainer
│   │   │   │   ├── List
│   │   │   │   │   ├── ListHeader
│   │   │   │   │   ├── CardList
│   │   │   │   │   │   ├── Card
│   │   │   │   │   │   │   ├── CardContent
│   │   │   │   │   │   │   ├── CardLabels
│   │   │   │   │   │   │   └── CardActions
│   │   │   │   │   │   └── AddCardButton
│   │   │   │   │   └── ListActions
│   │   │   │   └── AddListButton
│   │   │   └── BoardSettings
│   │   └── Settings
│   └── Modals (Card Edit, Board Settings, etc.)
└── Login/Register Components
```

### State Management Architecture

#### Redux Store Structure
```typescript
interface RootState {
  auth: AuthState;
  boards: BoardsState;
  ui: UIState;
  api: ApiState; // RTK Query
}

interface BoardsState {
  currentBoard: Board | null;
  boards: Board[];
  lists: Record<string, List>;
  cards: Record<string, Card>;
  dragState: DragState;
}

interface UIState {
  modals: {
    cardEdit: { open: boolean; cardId: string | null };
    boardSettings: { open: boolean; boardId: string | null };
  };
  sidebar: { collapsed: boolean };
  theme: 'light' | 'dark' | 'system';
}
```

#### RTK Query API Slices
```typescript
// boardsApi.ts
export const boardsApi = createApi({
  reducerPath: 'boardsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/boards',
    prepareHeaders: (headers, { getState }) => {
      // Add auth token
    },
  }),
  tagTypes: ['Board', 'List', 'Card'],
  endpoints: (builder) => ({
    getBoards: builder.query<Board[], void>(),
    createBoard: builder.mutation<Board, CreateBoardRequest>(),
    updateBoard: builder.mutation<Board, UpdateBoardRequest>(),
    deleteBoard: builder.mutation<void, string>(),
    // Lists and cards endpoints...
  }),
});
```

### Frontend Component Design Patterns

1. **Container/Presentation Pattern**
   - Container components handle data fetching and state
   - Presentation components focus on rendering and user interaction

2. **Custom Hooks for Logic**
   - `useAuth()` - Authentication state and methods
   - `useDragAndDrop()` - Drag and drop logic
   - `useLocalStorage()` - Local storage persistence
   - `useKeyboardShortcuts()` - Keyboard navigation

3. **Error Boundaries**
   - Component-level error handling
   - Fallback UI for failed renders
   - Error reporting to logging system

## Backend Architecture

### API Structure
```
/api/v1/
├── auth/
│   ├── POST /verify-token
│   └── POST /refresh-token
├── boards/
│   ├── GET    /                 # List all boards
│   ├── POST   /                 # Create board
│   ├── GET    /:id              # Get specific board
│   ├── PUT    /:id              # Update board
│   ├── DELETE /:id              # Delete board
│   └── GET    /:id/export       # Export board data
├── lists/
│   ├── POST   /                 # Create list
│   ├── PUT    /:id              # Update list
│   ├── DELETE /:id              # Delete list
│   └── PUT    /:id/position     # Reorder list
└── cards/
    ├── POST   /                 # Create card
    ├── GET    /:id              # Get card details
    ├── PUT    /:id              # Update card
    ├── DELETE /:id              # Delete card
    ├── PUT    /:id/position     # Move card
    └── POST   /:id/comments     # Add comment
```

### Backend Service Architecture
```typescript
// Service Layer
interface BoardService {
  findAll(userId: string): Promise<Board[]>;
  findById(id: string, userId: string): Promise<Board>;
  create(data: CreateBoardData, userId: string): Promise<Board>;
  update(id: string, data: UpdateBoardData, userId: string): Promise<Board>;
  delete(id: string, userId: string): Promise<void>;
}

// Repository Layer
interface BoardRepository {
  findByUserId(userId: string): Promise<Board[]>;
  findById(id: string): Promise<Board | null>;
  create(board: Board): Promise<Board>;
  update(id: string, changes: Partial<Board>): Promise<Board>;
  delete(id: string): Promise<void>;
}

// Controller Layer
class BoardController {
  constructor(
    private boardService: BoardService,
    private authService: AuthService
  ) {}

  async getBoards(req: AuthenticatedRequest, res: Response) {
    const boards = await this.boardService.findAll(req.user.id);
    res.json(boards);
  }
}
```

### Middleware Stack
```typescript
// Express middleware chain
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS configuration
app.use(express.json({ limit: '10mb' })); // Body parsing
app.use(requestLogger); // Request logging
app.use('/api', rateLimiter); // Rate limiting
app.use('/api', authMiddleware); // Authentication
app.use('/api/v1', apiRouter); // API routes
app.use(errorHandler); // Global error handling
```

## Database Design and Data Flow

### Database Schema (SQLite + Prisma)
```prisma
model User {
  id        String   @id @default(uuid())
  firebaseId String  @unique
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  boards    Board[]
  
  @@map("users")
}

model Board {
  id          String    @id @default(uuid())
  name        String
  description String?
  color       String?
  archived    Boolean   @default(false)
  position    Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lists       List[]
  
  @@map("boards")
}

model List {
  id        String   @id @default(uuid())
  name      String
  position  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards     Card[]
  
  @@map("lists")
}

model Card {
  id          String    @id @default(uuid())
  title       String
  description String?
  position    Int       @default(0)
  dueDate     DateTime?
  completed   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  listId      String
  list        List      @relation(fields: [listId], references: [id], onDelete: Cascade)
  labels      Label[]
  comments    Comment[]
  activities  Activity[]
  
  @@map("cards")
}

model Label {
  id       String @id @default(uuid())
  name     String
  color    String
  
  cardId   String
  card     Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)
  
  @@map("labels")
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  
  cardId    String
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  
  @@map("comments")
}

model Activity {
  id        String   @id @default(uuid())
  type      String   // 'created', 'moved', 'updated', 'commented'
  data      String   // JSON data about the activity
  createdAt DateTime @default(now())
  
  cardId    String
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  
  @@map("activities")
}
```

### Data Flow Patterns

#### Create Card Flow
```
1. User clicks "Add Card" in React
2. Redux action dispatched
3. RTK Query mutation triggered
4. API call to POST /api/v1/cards
5. Express middleware validates auth
6. Controller validates input
7. Service layer processes business logic
8. Repository creates card in SQLite
9. Activity log entry created
10. Response sent back to frontend
11. RTK Query updates cache
12. UI re-renders with new card
```

#### Drag and Drop Flow
```
1. User drags card to new position
2. Optimistic update in Redux state
3. Background API call to PUT /api/v1/cards/:id/position
4. Server calculates new positions for affected cards
5. Database transaction updates multiple cards
6. If API call fails, revert optimistic update
7. If successful, sync final positions
```

## External Service Integrations

### Firebase Authentication Integration
```typescript
// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

// Auth service
class AuthService {
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return this.processAuthResult(result);
  }

  async verifyToken(token: string) {
    // Backend verification with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  }
}
```

### Future Integration Points
- **Export Services**: JSON, CSV, PDF export
- **Import Services**: Trello, Google Tasks import
- **Backup Services**: Cloud storage backup (future)
- **Notification Services**: Email/push notifications (future)

## Caching Strategy

### Frontend Caching
- **RTK Query**: Automatic API response caching with configurable TTL
- **Browser Storage**: Redux state persistence for offline functionality
- **Image Caching**: Browser native caching for avatars and assets

### Backend Caching
- **In-Memory Cache**: Redis container for session data (future)
- **Database Query Optimization**: Prisma query optimization and connection pooling
- **Static Asset Caching**: Nginx caching for static files

### Cache Invalidation Strategy
- **Tag-based invalidation**: RTK Query tags for granular cache updates
- **Optimistic updates**: Immediate UI updates with background sync
- **Real-time sync**: WebSocket connection for multi-device sync (future)
