# Routing in DriftBoard

DriftBoard uses **React Router** (`react-router-dom`), the standard library for handling navigation in React applications. It allows us to create a single-page application (SPA) with multiple views or "pages" that can be accessed via unique URLs, without requiring a full page reload from the server.

## Core Concepts

### 1. Router Setup (`main.tsx` and `App.tsx`)

- **`BrowserRouter`**: In `src/frontend/src/main.tsx`, the entire `App` component is wrapped in `<BrowserRouter>`. This component uses the browser's History API to keep the UI in sync with the URL.
- **`Routes` and `Route`**: In `src/frontend/src/App.tsx`, we define the application's routes.
    - The `<Routes>` component is a container for all possible routes.
    - Each `<Route>` component maps a URL `path` to a specific React `element` (a page component).

```tsx
// Example from App.tsx
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { BoardsPage } from './pages/BoardsPage';
import { BoardDetailPage } from './pages/BoardDetailPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <BoardsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/board/:boardId" 
        element={
          <ProtectedRoute>
            <BoardDetailPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

### 2. Dynamic Routes and URL Parameters

To create pages for specific items, like a particular Kanban board, we use URL parameters.

- **Syntax**: A colon (`:`) in the path indicates a parameter (e.g., `/board/:boardId`).
- **Accessing Params**: The `useParams` hook from `react-router-dom` allows a component to access these parameters.

```tsx
// Inside BoardDetailPage.tsx
import { useParams } from 'react-router-dom';

export const BoardDetailPage = () => {
  const { boardId } = useParams(); // e.g., if URL is /board/123, boardId will be "123"
  
  // Now you can use boardId to fetch the specific board's data
  const { data: board } = useGetBoardQuery(boardId);

  // ...
};
```

### 3. Navigation

We use the `<Link>` component or the `useNavigate` hook to navigate between pages programmatically.

- **`<Link>` Component**: Use this for standard navigation, like links in a header or sidebar. It renders an `<a>` tag but prevents the default browser navigation.

```tsx
import { Link } from 'react-router-dom';

<Link to={`/board/${board.id}`}>View Board</Link>
```

- **`useNavigate` Hook**: Use this for navigation that happens as the result of an action, like after a form submission.

```tsx
import { useNavigate } from 'react-router-dom';

const MyFormComponent = () => {
  const navigate = useNavigate();

  const handleFormSubmit = async (data) => {
    const newBoard = await createBoard(data).unwrap();
    navigate(`/board/${newBoard.id}`); // Redirect to the new board's page
  };
  
  // ...
};
```

### 4. Protected Routes

A critical feature for any application with authentication is restricting access to certain pages. In DriftBoard, we use a custom `ProtectedRoute` component.

- **How it Works**:
    1. The `ProtectedRoute` component wraps the page component that needs protection.
    2. It uses a Redux selector (`useSelector`) to check the authentication status from the `authSlice`.
    3. If the user is authenticated, it renders the `children` (the actual page).
    4. If the user is not authenticated, it uses the `<Navigate>` component from React Router to redirect them to the `/login` page.
