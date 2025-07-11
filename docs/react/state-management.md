# State Management in DriftBoard

DriftBoard uses a layered approach to state management, leveraging both React's built-in hooks and Redux Toolkit (RTK) for a predictable, scalable, and efficient state architecture.

## The State Management Hierarchy

We categorize state into four types and use the best tool for each job:

1.  **Local/Component State**: Managed with `useState` and `useReducer`.
2.  **Global UI State**: Managed with a dedicated Redux Toolkit slice (`uiSlice`).
3.  **Server Cache State**: Managed with **RTK Query**.
4.  **Global Auth State**: Managed with a dedicated Redux Toolkit slice (`authSlice`).

---

### 1. Local/Component State (`useState`, `useReducer`)

- **When to Use**: For state that is only needed by a single component or a small, co-located group of components.
- **Examples**:
    - Toggling the visibility of a dropdown menu.
    - Managing the input values of a form before submission.
    - Tracking whether a dialog is open or closed.
- **Why**: It's the simplest and most performant solution for local state. It avoids unnecessary re-renders of the entire application when only a small part of the UI needs to change.

### 2. Global UI State (`uiSlice`)

- **When to Use**: For global UI state that needs to be shared across different, non-related parts of the component tree.
- **Examples**:
    - Managing the state of a global notification or toast message system.
    - Toggling a global sidebar or modal that can be triggered from anywhere.
- **Why**: A Redux slice provides a centralized place to manage this state, making it accessible from any component without "prop drilling" (passing props down through many layers).

### 3. Server Cache State (RTK Query)

- **What it is**: This is not just data; it's a **cache** of the data that lives on your backend server. RTK Query handles the entire lifecycle of fetching, caching, and updating this data.
- **When to Use**: For any data that comes from your API. This includes boards, lists, and cards.
- **Why**: RTK Query is the most powerful tool in our state management arsenal. It automatically handles:
    - **Fetching and Caching**: It fetches data and keeps it in the Redux store. Subsequent requests for the same data are served from the cache instantly.
    - **Automatic Re-fetching**: It intelligently re-fetches data when it might be stale (e.g., when the user re-focuses the browser window).
    - **Loading and Error States**: It provides simple hooks (`useGetBoardsQuery`) that return `data`, `isLoading`, `isError`, etc., which simplifies UI code immensely.
    - **Mutations and Cache Invalidation**: When you update data (e.g., create a new board), you can "invalidate" the cached list of boards, which triggers an automatic re-fetch to keep the UI in sync.
    - **Optimistic Updates**: For a super-responsive UI, you can update the local cache *before* the API call completes, and roll it back if the call fails. This is perfect for features like drag-and-drop.

### 4. Global Auth State (`authSlice`)

- **What it is**: A specialized Redux slice that holds the user's authentication status, user information, and JWT token.
- **When to Use**: For managing the application's current user session.
- **Why**: This state is fundamentally global. Many parts of the application need to know if a user is logged in:
    - **`ProtectedRoute`**: To allow or deny access to pages.
    - **`Header`**: To show a "Login" or "Logout" button.
    - **RTK Query**: To grab the auth token and send it with every API request.

By separating state concerns this way, we keep the application organized, reduce complexity, and leverage the best tool for each specific scenario.
