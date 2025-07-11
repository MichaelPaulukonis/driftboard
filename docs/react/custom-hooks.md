# Custom Hooks in DriftBoard

In React, a **custom hook** is a JavaScript function whose name starts with `use` and that can call other hooks. They are a powerful tool for reusing stateful logic between components without having to change your component hierarchy.

In DriftBoard, we use custom hooks to encapsulate and share logic that is used in multiple places, keeping our components cleaner and more focused on rendering the UI. Our custom hooks are located in `src/frontend/src/hooks/`.

## Why Use Custom Hooks?

Imagine you have logic to detect the screen width to render different layouts for mobile and desktop. You might need this in several components. Instead of duplicating this logic everywhere, you can extract it into a custom hook.

**Without a custom hook (Bad):**

```tsx
// ComponentA.tsx
const [width, setWidth] = useState(window.innerWidth);
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
const isMobile = width < 768;

// ComponentB.tsx
// ... same exact logic duplicated here ...
```

**With a custom hook (Good):**

```tsx
// hooks/useViewport.ts
export const useViewport = () => {
  const [width, setWidth] = useState(window.innerWidth);
  // ... effect logic ...
  return { width, isMobile: width < 768 };
};

// ComponentA.tsx
const { isMobile } = useViewport();

// ComponentB.tsx
const { isMobile } = useViewport();
```

## Custom Hooks in DriftBoard

Here are some examples of custom hooks you might find or create in the DriftBoard project:

### `useBoards`

A potential hook to encapsulate the logic for fetching and managing the list of boards. It would wrap the RTK Query hook and could provide additional computed values.

```tsx
import { useGetBoardsQuery } from '@/api/api';

export const useBoards = () => {
  const { data: boards = [], isLoading, isError } = useGetBoardsQuery();

  // We could add more logic here, e.g., sorting or filtering
  const sortedBoards = [...boards].sort((a, b) => a.name.localeCompare(b.name));

  return {
    boards: sortedBoards,
    isLoading,
    isError,
  };
};
```

### `useDebounce`

A common utility hook to debounce a value. This is useful for features like search, where you want to wait until the user has stopped typing before firing an API request.

```tsx
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### `useAuth`

A simple hook to provide convenient access to the authentication state from the Redux store.

```tsx
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export const useAuth = () => {
  const authState = useSelector((state: RootState) => state.auth);
  return {
    ...authState,
    isAuthenticated: !!authState.token,
  };
};
```

By creating and using custom hooks, we adhere to the **DRY (Don't Repeat Yourself)** principle and make our stateful logic portable and easy to test in isolation.
