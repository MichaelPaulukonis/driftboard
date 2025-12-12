 Component Architecture

  The frontend exclusively uses Function Components with Hooks. This is evident from:

   * The use of the function ComponentName() { ... } and const ComponentName: React.FC = () => { ... } syntax.
   * The extensive use of React Hooks like useState, useEffect, useCallback, useMemo, and useDispatch across all components.
   * The complete absence of class ComponentName extends React.Component and lifecycle methods like componentDidMount.

  Key Technologies & Patterns

   1. State Management: The application uses Redux Toolkit for global state management.
       * store/index.ts configures the Redux store using configureStore.
       * store/authSlice.ts defines a slice for authentication state using createSlice.
       * Components interact with the store using the useSelector and useDispatch hooks (ProtectedRoute.tsx, App.tsx).

   2. API Communication & Data Fetching: Data fetching, caching, and server-state synchronization are handled by RTK Query.
       * api/api.ts defines a single API slice using createApi that manages all backend interactions for boards, lists, and cards.
       * It automatically generates hooks like useGetBoardsQuery and useCreateBoardMutation, which are used in the page components (BoardsPage.tsx,
         BoardDetailPage.tsx).
       * It handles token-based authorization by injecting the Firebase idToken into request headers.
       * It uses a tag-based system (providesTags, invalidatesTags) to automate cache invalidation and re-fetching, ensuring the UI stays up-to-date
         after mutations.

   3. Routing: Client-side routing is managed by React Router.
       * App.tsx defines the application's routes using <Routes> and <Route>.
       * It implements protected routes using a custom <ProtectedRoute> component.
       * Navigation is handled with the <Link> component and the useNavigate hook.

   4. Authentication: Firebase Authentication is used for user management.
       * firebase.ts initializes the Firebase app and auth service.
       * App.tsx uses onAuthStateChanged to listen for authentication state changes and update the Redux store accordingly.
       * LoginPage.tsx and SignUpPage.tsx use Firebase methods like signInWithEmailAndPassword, signInWithPopup, and createUserWithEmailAndPassword
         for user login and registration.
       * The custom useLogout hook encapsulates the sign-out logic.

   5. Styling: The project uses a combination of Tailwind CSS and a custom UI component library.
       * The index.css file includes Tailwind's base, components, and utilities.
       * Components are styled with Tailwind utility classes (e.g., className="flex items-center justify-center").
       * The components/ui directory contains reusable, styled components like Button, Card, and Input. This setup, using cva
         (class-variance-authority) and a cn utility function, is characteristic of libraries like shadcn/ui, allowing for consistent and composable
         UI elements.

   6. Drag and Drop: The Kanban board's drag-and-drop functionality is powered by @dnd-kit.
       * BoardDetailPage.tsx orchestrates the drag-and-drop logic using DndContext, sensors, and event handlers (onDragStart, onDragEnd).
       * Board.tsx and List.tsx use SortableContext to define the draggable regions for lists and cards.
       * KanbanCard.tsx and List.tsx use the useSortable hook to make individual items draggable and to handle their visual state during drag
         operations.

   7. TypeScript: The entire frontend codebase is written in TypeScript, providing strong typing for props, state, and API payloads. Types are
      shared with the backend via the src/shared/types directory.