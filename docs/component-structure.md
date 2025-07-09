# DriftBoard Component Structure Guide

## Overview

This document outlines the recommended React component organization for DriftBoard, following React best practices and feature-based architecture patterns.

## Directory Structure

```
src/frontend/src/components/
├── ui/                    # ShadCN/UI base components
│   ├── button.tsx         # Reusable button component
│   ├── dialog.tsx         # Modal dialog component
│   ├── input.tsx          # Form input component
│   ├── card.tsx           # Base card container
│   ├── dropdown-menu.tsx  # Context menu component
│   └── toast.tsx          # Notification component
├── kanban/               # Kanban-specific business components
│   ├── Board.tsx          # Main board container
│   ├── BoardGrid.tsx      # Grid layout for multiple boards
│   ├── BoardCard.tsx      # Individual board preview card
│   ├── List.tsx           # Kanban list/column
│   ├── Card.tsx           # Individual kanban card
│   ├── CardModal.tsx      # Card detail editing modal
│   └── DragDropProvider.tsx # Drag and drop context (Phase 2)
├── forms/                # Reusable form components
│   ├── BoardForm.tsx      # Create/edit board form
│   ├── ListForm.tsx       # Create/edit list form
│   ├── CardForm.tsx       # Create/edit card form
│   └── QuickAddCard.tsx   # Inline card creation
└── layout/               # Application layout components
    ├── AppLayout.tsx      # Main application shell
    ├── Header.tsx         # Top navigation/header
    ├── Sidebar.tsx        # Navigation sidebar (future)
    └── ErrorBoundary.tsx  # Error handling wrapper
```

## Component Architecture Principles

### 1. Component Types

**UI Components (`ui/`)**
- Pure, reusable components from ShadCN/UI
- No business logic or state management
- Styled with Tailwind CSS
- Fully accessible (WCAG 2.1 AA)
- TypeScript interfaces for all props

**Business Components (`kanban/`, `forms/`)**
- Feature-specific components with business logic
- Connected to Redux store via RTK Query
- Handle user interactions and state updates
- Compose UI components for functionality

**Layout Components (`layout/`)**
- Application structure and navigation
- Route-level error boundaries
- Global state providers
- Authentication wrappers (Phase 3+)

### 2. Component Naming Conventions

- **PascalCase** for all component files and exports
- **Descriptive names** that indicate purpose
- **Suffix conventions**:
  - `Form` - for form components
  - `Modal` - for modal dialogs
  - `Provider` - for context providers
  - `Card` - for card-like containers

### 3. Component Structure Template

```tsx
// 1. Imports (external libraries first, then internal)
import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBoardsQuery } from '@/api/boardsApi';

// 2. Types and interfaces
interface BoardCardProps {
  board: Board;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

// 3. Component definition with proper typing
export const BoardCard: React.FC<BoardCardProps> = ({ 
  board, 
  onEdit, 
  onDelete, 
  className 
}) => {
  // 4. Hooks and state (order: Redux, React state, custom hooks)
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { data: boardData } = useBoardsQuery(board.id);

  // 5. Event handlers (use useCallback for performance)
  const handleEdit = useCallback(() => {
    onEdit?.(board.id);
  }, [board.id, onEdit]);

  const handleDelete = useCallback(async () => {
    setIsLoading(true);
    try {
      onDelete?.(board.id);
    } finally {
      setIsLoading(false);
    }
  }, [board.id, onDelete]);

  // 6. Render JSX
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">{board.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{board.description}</p>
      
      <div className="flex gap-2">
        <Button onClick={handleEdit} variant="outline" size="sm">
          Edit
        </Button>
        <Button 
          onClick={handleDelete} 
          variant="destructive" 
          size="sm" 
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Card>
  );
};
```

## State Management Integration

### Redux Connection Patterns

```tsx
// RTK Query for server state
const { data: boards, isLoading } = useBoardsQuery();

// Redux selectors for client state
const selectedBoard = useSelector(selectCurrentBoard);

// Dispatch actions
const dispatch = useDispatch();
const handleCreateBoard = (boardData: CreateBoardData) => {
  dispatch(createBoard(boardData));
};
```

### Component State Guidelines

- **Local state** (`useState`) for:
  - Form inputs
  - Modal open/close states
  - Loading states for individual actions
  - UI-only state (expanded/collapsed)

- **Redux state** for:
  - Server data (via RTK Query)
  - Global UI state (selected board, sidebar open)
  - User authentication state
  - Cross-component shared state

## Implementation Phases

### Phase 1 (MVP - Current)
```
✅ ui/button.tsx, ui/input.tsx, ui/card.tsx
✅ kanban/Board.tsx, kanban/List.tsx, kanban/Card.tsx
✅ forms/BoardForm.tsx, forms/CardForm.tsx
✅ layout/AppLayout.tsx, layout/Header.tsx
```

### Phase 2 (Enhanced Features)
```
🔄 ui/dialog.tsx, ui/dropdown-menu.tsx
🔄 kanban/CardModal.tsx, kanban/DragDropProvider.tsx
🔄 forms/QuickAddCard.tsx
🔄 layout/ErrorBoundary.tsx
```

### Phase 3 (Polish & Scale)
```
⏳ ui/toast.tsx, ui/popover.tsx
⏳ kanban/BoardGrid.tsx with virtualization
⏳ layout/Sidebar.tsx
⏳ Authentication wrappers
```

## Testing Strategy by Component Type

### UI Components
```typescript
// Focus on accessibility and visual consistency
test('Button renders with correct variant styles', () => {
  render(<Button variant="primary">Click me</Button>);
  expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
});
```

### Business Components
```typescript
// Focus on user interactions and state changes
test('BoardCard calls onEdit when edit button clicked', async () => {
  const mockOnEdit = vi.fn();
  render(<BoardCard board={mockBoard} onEdit={mockOnEdit} />);
  
  await user.click(screen.getByRole('button', { name: /edit/i }));
  expect(mockOnEdit).toHaveBeenCalledWith(mockBoard.id);
});
```

### Integration Tests
```typescript
// Test component composition and data flow
test('Board displays lists and cards correctly', async () => {
  render(<Board boardId="123" />, { wrapper: ReduxProvider });
  
  await waitFor(() => {
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Memoization Strategy
- Use `React.memo` for expensive components
- Use `useCallback` for event handlers passed as props
- Use `useMemo` for expensive calculations

### Code Splitting
```tsx
// Lazy load heavy components
const CardModal = lazy(() => import('./CardModal'));

// Use Suspense for loading states
<Suspense fallback={<CardModalSkeleton />}>
  <CardModal />
</Suspense>
```

### Virtual Scrolling (Phase 3)
- Implement for boards with 100+ cards
- Use `react-window` or similar library
- Maintain keyboard navigation and accessibility

## Accessibility Guidelines

### Semantic HTML
- Use proper heading hierarchy (`h1`, `h2`, `h3`)
- Use `button` elements for clickable actions
- Use `form` elements for data input

### ARIA Labels
```tsx
<button 
  aria-label={`Edit board ${board.name}`}
  onClick={handleEdit}
>
  <EditIcon />
</button>
```

### Keyboard Navigation
- Ensure all interactive elements are focusable
- Implement proper tab order
- Support arrow key navigation for kanban boards

## Future Enhancements

### Drag and Drop (Phase 2)
- Implement with @dnd-kit library
- Support keyboard-based drag and drop
- Maintain focus management during operations

### Real-time Updates (Phase 4)
- WebSocket integration for live updates
- Optimistic updates with conflict resolution
- Collaborative cursors and awareness

This component structure provides a solid foundation for DriftBoard's growth from MVP to a full-featured kanban application while maintaining code quality and developer experience.
