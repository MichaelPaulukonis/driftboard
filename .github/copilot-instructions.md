# GitHub Copilot Instructions for DriftBoard

## Project Context

This is a **Personal Kanban Board Application (API + Web App)** built with TypeScript and Node.js. DriftBoard is designed as a cost-effective, self-hosted alternative to Trello with a focus on simplicity and learning modern web development practices.

## Technology Stack

When suggesting code, please use the following technologies:

- **React 18+** with TypeScript and functional components using hooks
- **Vite** for build tooling and development server
- **Redux Toolkit (RTK)** with RTK Query for state management and API caching
- **TypeScript** in strict mode for all code files with comprehensive typing
- **Tailwind CSS** for utility-first styling
- **ShadCN/UI** components built on Radix UI primitives
- **Express.js** backend API with TypeScript
- **Prisma ORM** with SQLite database (MVP) → PostgreSQL (future)
- **Firebase Auth** for authentication (Phase 3+)
- **@dnd-kit** for drag-and-drop functionality (Phase 2)

## 1. Project Structure

1. Follow the monolithic full-stack architecture with clear separation:
   
   **Frontend (`src/frontend/`):**
   - **src/**: Main React application source
     - **components/**: Reusable UI components
       - **ui/**: ShadCN/UI base components (Button, Dialog, Input, Card)
       - **kanban/**: Kanban-specific components (Board, List, Card, BoardList)
       - **forms/**: Reusable form components (BoardForm, CardForm)
       - **layout/**: Layout components (Header, Sidebar, Layout)
     - **pages/**: Route-level page components (BoardsPage, BoardDetailPage)
     - **store/**: Redux Toolkit store configuration and slices
     - **api/**: RTK Query API definitions and endpoints
     - **hooks/**: Custom React hooks and composables
     - **utils/**: Helper functions and utilities
   
   **Backend (`src/backend/`):**
   - **server.ts**: Main Express application entry point
   - **routes/**: API route handlers (boards, lists, cards, auth)
   - **middleware/**: Express middleware (auth, error handling, logging)
   - **services/**: Business logic and data access layer
   - **utils/**: Backend utility functions
   
   **Shared (`src/shared/`):**
   - **types/**: TypeScript interfaces and types used across frontend/backend
   - **generated/**: Prisma client and generated types

2. Database and Infrastructure:
   - **prisma/**: Database schema, migrations, and seed data
   - **data/**: SQLite database file (gitignored)
   - **tests/**: Unit, integration, and E2E tests
   - **docs/**: Architecture documentation and project plans

3. Maintain clear separation between frontend and backend with API-first design.
4. Use absolute imports with path aliases (`@/` for src directories - already configured in Vite and TypeScript).

## 2. Coding Standards

1. Use ESLint and Prettier for code quality and consistent formatting.

2. **Always use TypeScript** with strict mode enabled. Define comprehensive types in shared/types/.

3. Follow consistent naming conventions:
   - Components and Types: PascalCase (`BoardCard`, `ApiResponse`)
   - Files and folders: kebab-case (`board-detail.tsx`, `api-client.ts`)
   - Variables and functions: camelCase (`handleCardMove`, `fetchBoards`)
   - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`, `DEFAULT_BOARD_NAME`)

4. Use async/await over promises for asynchronous operations.

5. **React Component Structure**: Always follow this order for consistency:
   ```tsx
   // 1. Imports (external libraries first, then internal)
   import React from 'react';
   import { useSelector, useDispatch } from 'react-redux';
   import { Button } from '@/components/ui/button';
   import { useBoards } from '@/hooks/useBoards';
   
   // 2. Types and interfaces
   interface BoardCardProps {
     board: Board;
     onEdit: (id: string) => void;
   }
   
   // 3. Component definition
   export const BoardCard: React.FC<BoardCardProps> = ({ board, onEdit }) => {
     // 4. Hooks and state
     const dispatch = useDispatch();
     const [isLoading, setIsLoading] = useState(false);
     
     // 5. Event handlers
     const handleClick = useCallback(() => {
       onEdit(board.id);
     }, [board.id, onEdit]);
     
     // 6. Render
     return (
       <div className="p-4 border rounded-lg">
         {/* Component JSX */}
       </div>
     );
   };
   ```

6. Always use semantic HTML and ensure WCAG 2.1 AA compliance.

## 3. Prettier Configuration

1. **Semicolons**: Always use semicolons for clarity
2. **Indentation**: 2 spaces per level
3. **Quotes**: Single quotes for strings, double quotes for JSX attributes
4. **Line Length**: 100 characters maximum
5. **Trailing Commas**: Use trailing commas in multi-line structures

## 4. React Best Practices

1. **Functional Components Only**: Use React 18+ features with hooks pattern.

2. **State Management Hierarchy**:
   - Local component state: `useState`, `useReducer`
   - Shared state: Redux Toolkit slices
   - Server state: RTK Query with automatic caching
   - URL state: React Router params and search params

3. **Component Props**: Define with TypeScript interfaces:
   ```typescript
   interface CardProps {
     card: Card;
     onMove?: (cardId: string, targetListId: string) => void;
     isDragging?: boolean;
     className?: string;
   }
   ```

4. **Event Handling**: Use descriptive names and proper typing:
   ```typescript
   const handleCardDrop = useCallback((event: DragEndEvent) => {
     // Handle drag and drop logic
   }, []);
   ```

5. **Error Boundaries**: Implement for robust error handling in production.

## 5. Redux Toolkit Patterns

1. **Store Structure**: Organize by feature domains:
   ```typescript
   // store/index.ts
   export const store = configureStore({
     reducer: {
       boards: boardsSlice.reducer,
       lists: listsSlice.reducer,
       cards: cardsSlice.reducer,
       auth: authSlice.reducer,
       ui: uiSlice.reducer,
     },
     middleware: (getDefaultMiddleware) =>
       getDefaultMiddleware().concat(api.middleware),
   });
   ```

2. **RTK Query**: Define API endpoints with proper typing:
   ```typescript
   export const boardsApi = createApi({
     reducerPath: 'boardsApi',
     baseQuery: fetchBaseQuery({
       baseUrl: '/api/boards',
       prepareHeaders: (headers, { getState }) => {
         // Add auth headers
         return headers;
       },
     }),
     tagTypes: ['Board', 'List', 'Card'],
     endpoints: (builder) => ({
       getBoards: builder.query<Board[], void>({
         query: () => '',
         providesTags: ['Board'],
       }),
     }),
   });
   ```

3. **Optimistic Updates**: Implement for smooth UX in drag-and-drop operations.

## 6. Backend API Development

1. **Express Route Structure**: Organize by resource with proper middleware:
   ```typescript
   // routes/boards.ts
   import { Router } from 'express';
   import { authMiddleware } from '../middleware/authMiddleware';
   import { validateRequest } from '../middleware/validation';
   import { boardSchema } from '../schemas/board';
   
   const router = Router();
   
   router.use(authMiddleware); // Apply auth to all board routes
   
   router.get('/', getBoardsHandler);
   router.post('/', validateRequest(boardSchema), createBoardHandler);
   ```

2. **Database Operations**: Use Prisma with proper error handling:
   ```typescript
   export const createBoard = async (data: CreateBoardInput): Promise<Board> => {
     try {
       return await prisma.board.create({
         data,
         include: {
           lists: {
             include: {
               cards: true,
             },
           },
         },
       });
     } catch (error) {
       throw new DatabaseError('Failed to create board', error);
     }
   };
   ```

3. **Input Validation**: Use Zod schemas for request validation:
   ```typescript
   import { z } from 'zod';
   
   export const createBoardSchema = z.object({
     name: z.string().min(1).max(100),
     description: z.string().optional(),
     color: z.string().optional(),
   });
   ```

## 7. Kanban-Specific Features

### Board Management
- Support for creating, editing, archiving boards
- Board templates and color themes
- Board-level permissions (future multi-user)

### List Operations
- Dynamic list creation and reordering
- List archiving and restoration
- Position-based ordering system

### Card Functionality
- Rich card editing with markdown support (planned)
- Card metadata: labels, due dates, checklists
- Activity history and comments
- Cross-card linking capabilities
- File attachments (future)

### Drag-and-Drop Implementation
Use @dnd-kit for accessibility and touch support:
```typescript
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    // Dispatch move action with optimistic update
    dispatch(moveCard({ cardId: active.id, targetListId: over.id }));
  }
};
```

## 8. Database Design Patterns

1. **Prisma Schema**: Follow relational best practices:
   ```prisma
   model Board {
     id          String   @id @default(cuid())
     name        String
     description String?
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     archivedAt  DateTime?
     
     lists List[]
     
     @@map("boards")
   }
   ```

2. **Position-based Ordering**: Use decimal positions for efficient reordering:
   ```typescript
   // Calculate position between two items
   const calculatePosition = (before?: number, after?: number): number => {
     if (!before && !after) return 1000;
     if (!before) return after / 2;
     if (!after) return before + 1000;
     return (before + after) / 2;
   };
   ```

## 9. Styling with Tailwind CSS

1. **Component Styling**: Use utility classes with consistent patterns:
   ```tsx
   <div className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
     <h3 className="text-lg font-semibold text-gray-900 mb-2">{board.name}</h3>
     <p className="text-sm text-gray-600">{board.description}</p>
   </div>
   ```

2. **ShadCN/UI Components**: Prefer composed UI components:
   ```tsx
   import { Button } from '@/components/ui/button';
   import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
   
   <Dialog open={isOpen} onOpenChange={setIsOpen}>
     <DialogContent>
       <DialogHeader>
         <DialogTitle>Create New Board</DialogTitle>
       </DialogHeader>
       {/* Form content */}
     </DialogContent>
   </Dialog>
   ```

3. **Responsive Design**: Mobile-first approach with breakpoint utilities.

4. **Custom CSS**: Use CSS variables for theme consistency:
   ```css
   :root {
     --color-primary: 59 130 246; /* blue-500 */
     --color-success: 34 197 94;  /* green-500 */
     --color-danger: 239 68 68;   /* red-500 */
   }
   ```

## 10. Authentication & Security

1. **Firebase Auth Integration** (Phase 3+):
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
   
   export const auth = getAuth(firebaseApp);
   
   export const signIn = async (email: string, password: string) => {
     try {
       const userCredential = await signInWithEmailAndPassword(auth, email, password);
       return userCredential.user;
     } catch (error) {
       throw new AuthError('Sign in failed', error);
     }
   };
   ```

2. **JWT Token Handling**: Secure token storage and refresh:
   ```typescript
   // Store tokens securely
   const storeTokens = (tokens: AuthTokens) => {
     // Use httpOnly cookies in production
     localStorage.setItem('accessToken', tokens.accessToken);
   };
   ```

3. **API Security**: Input validation, rate limiting, CORS configuration.

## 11. Testing Strategy

1. **Unit Tests**: Use Vitest for business logic and utilities:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { calculatePosition } from '../utils/position';
   
   describe('calculatePosition', () => {
     it('should calculate position between two items', () => {
       expect(calculatePosition(1000, 2000)).toBe(1500);
     });
   });
   ```

2. **Component Tests**: React Testing Library for user interactions (add when implementing component tests):
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react';
   import { Provider } from 'react-redux';
   import { BoardCard } from '../BoardCard';
   
   test('should call onEdit when clicked', () => {
     const mockOnEdit = vi.fn();
     render(<BoardCard board={mockBoard} onEdit={mockOnEdit} />);
     
     fireEvent.click(screen.getByText(mockBoard.name));
     expect(mockOnEdit).toHaveBeenCalledWith(mockBoard.id);
   });
   ```

3. **E2E Tests**: Playwright for critical user flows:
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test('should create and delete a board', async ({ page }) => {
     await page.goto('/boards');
     await page.click('[data-testid=create-board]');
     await page.fill('[data-testid=board-name]', 'Test Board');
     await page.click('[data-testid=save-board]');
     
     await expect(page.locator('text=Test Board')).toBeVisible();
   });
   ```

## 12. Performance Optimization

1. **Code Splitting**: Lazy load pages and large components:
   ```typescript
   const BoardDetailPage = lazy(() => import('./pages/BoardDetailPage'));
   
   <Suspense fallback={<Loading />}>
     <BoardDetailPage />
   </Suspense>
   ```

2. **Memoization**: Optimize re-renders with React.memo and useMemo:
   ```typescript
   export const CardList = React.memo<CardListProps>(({ cards, onMove }) => {
     const sortedCards = useMemo(() => 
       cards.sort((a, b) => a.position - b.position), 
       [cards]
     );
     
     return <div>{/* Render cards */}</div>;
   });
   ```

3. **RTK Query Caching**: Configure appropriate cache lifetimes and tag invalidation.

## 13. Docker & Deployment

1. **Development**: Use docker-compose for local development:
   ```yaml
   services:
     app:
       build: .
       ports:
         - "8000:8000"
       volumes:
         - ./data:/app/data
       environment:
         - NODE_ENV=development
   ```

2. **Production**: Multi-stage Docker builds for optimized images.

## 14. Documentation Standards

1. **Component Documentation**: Use JSDoc for complex components:
   ```typescript
   /**
    * Kanban board card component with drag-and-drop support
    * 
    * @param card - The card data to display
    * @param onMove - Callback when card is moved to different list
    * @param isDragging - Whether card is currently being dragged
    */
   export const Card: React.FC<CardProps> = ({ card, onMove, isDragging }) => {
     // Component implementation
   };
   ```

2. **API Documentation**: Document endpoints with OpenAPI/Swagger (future).

3. **Architecture Documentation**: Maintain in `docs/` directory with markdown.

4. **Plan File Naming**: Use consistent naming for project plan files in `docs/plans/`:
   ```
   Format: NN.semantic-name.md
   
   Examples:
   - 01.mvp-completion-summary.md
   - 02.e2e-testing-setup.md
   - 03.monolithic-implementation.md
   - 04.phase-assessment-next-steps.md
   
   Rules:
   - Two-digit prefix (01-99) for ordering
   - Dot separator after number
   - Kebab-case for semantic name
   - .md extension
   - Sequential numbering for chronological order
   ```

## 15. Commit Message Guidelines

Follow Conventional Commits specification:
- `feat(boards): add board archiving functionality`
- `fix(cards): resolve drag-and-drop position calculation`
- `docs(api): update endpoint documentation`
- `refactor(store): simplify RTK Query cache management`

## 16. Error Handling

1. **Frontend Error Boundaries**: Catch and display user-friendly errors.

2. **API Error Responses**: Consistent error format:
   ```typescript
   interface ApiError {
     error: {
       code: string;
       message: string;
       details?: unknown;
     };
     timestamp: string;
     path: string;
   }
   ```

3. **Graceful Degradation**: Handle offline scenarios and network failures.

## Key Differences from Standard React Apps

- **Kanban-specific UX patterns**: Focus on drag-and-drop, visual organization
- **Local-first architecture**: SQLite with potential for offline functionality
- **Single-user optimization**: Simplified auth and data models initially
- **Learning-focused**: Emphasis on modern React patterns and TypeScript
- **Cost-conscious**: Self-hosted deployment, minimal external dependencies

By following these guidelines, we ensure that DriftBoard remains efficient, scalable, and maintainable while providing an excellent user experience for personal kanban board management.
