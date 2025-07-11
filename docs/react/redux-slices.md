A **Redux slice** is a core concept in [Redux Toolkit (RTK)](https://redux-toolkit.js.org/), which is the standard way to write Redux logic today.

Think of a slice as a **self-contained bundle of logic for a single feature or domain** within your application's state. Instead of scattering action creators, action types, and reducer logic across multiple files, a slice co-locates them into one file, making your code more organized and easier to maintain.

A slice automatically generates action creators and action types, which significantly reduces boilerplate code.

### How It Relates to Auth State Management in DriftBoard

For authentication, you would create an `authSlice`. This slice is responsible for managing all state related to the user's authentication status.

Here’s what the `authSlice` in your project (`src/frontend/src/store/authSlice.ts`) manages:

1.  **State Shape**: It defines the structure of the authentication state. This typically includes:
    *   `user`: The currently logged-in user's information (e.g., `uid`, `email`), or `null` if no one is logged in.
    *   `token`: The Firebase ID token (JWT) needed to authenticate with your backend API.
    *   `status`: A string to track the status of async operations like logging in (e.g., `'idle'`, `'loading'`, `'succeeded'`, `'failed'`).

2.  **Reducers**: These are pure functions that handle state changes. The `authSlice` has reducers for actions like:
    *   `setUser`: An action that runs when a user successfully logs in. It updates the state to store the `user` object and `token`.
    *   `logout`: An action that runs when a user logs out. It resets the state by clearing the `user` and `token`.
    *   `setLoading`: An action to set the `status` to `'loading'` while a login attempt is in progress.

3.  **Async Thunks**: For asynchronous operations like communicating with Firebase, the slice uses `createAsyncThunk`. For example, a `login` thunk would:
    *   Make an async call to Firebase to sign the user in.
    *   On success, it would dispatch the `setUser` action with the user's data.
    *   On failure, it would update the state with an error message.

In summary, the **`authSlice` is your application's single source of truth for "who is logged in."** Any component in your React application can access this state to:

*   Conditionally render UI (e.g., show a "Login" button or a "Logout" button).
*   Protect routes, ensuring only authenticated users can access certain pages.
*   Provide the authentication token to the RTK Query API so it can be sent with every request to your secure backend.
