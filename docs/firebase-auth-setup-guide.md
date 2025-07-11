# Firebase Authentication Setup Guide

*Generated: July 11, 2025*

## 1. What is Firebase Authentication?

Firebase Authentication is a backend-as-a-service (BaaS) that provides ready-to-use UI libraries, SDKs, and backend services to authenticate users to your application. It supports various sign-in methods, including email/password, phone numbers, and federated identity providers like Google, GitHub, and Facebook.

For DriftBoard, it solves the problem of building a secure, scalable authentication system from scratch, allowing us to focus on core application features.

### How It Works: The Token-Based Flow

The process is based on JSON Web Tokens (JWTs), which Firebase calls "ID Tokens."

1.  **Client-Side Sign-in**: The user clicks a "Sign in with Google" button in the React frontend. The Firebase client-side SDK handles the OAuth flow with Google.
2.  **Receive ID Token**: After a successful sign-in, Google returns an authentication token to Firebase, which then provides the client app with a Firebase **ID Token (JWT)**. This token contains user information (like a unique `uid`, email, and name) and is cryptographically signed by Firebase.
3.  **Send Token to Backend**: The React app includes this ID Token in the `Authorization` header of every API request it sends to our Express backend (e.g., `Authorization: Bearer <ID_TOKEN>`).
4.  **Backend Verification**: The Express backend uses a protected middleware for all relevant routes. This middleware uses the **Firebase Admin SDK** to verify the signature and expiration of the ID Token. This step is secure and ensures the token was issued by Firebase and not tampered with.
5.  **Access Control**: If the token is valid, the middleware decodes it to get the user's `uid`. It attaches this user information to the Express request object (`req.user`).
6.  **User-Scoped Data**: The API route handlers then use `req.user.uid` in their Prisma database queries to fetch or modify data that belongs *only* to that specific user.

This flow ensures that users can only ever access their own boards, lists, and cards.

---

## 2. External Setup (Firebase Console)

Before writing any code, you need to configure the Firebase project.

1.  **Create Firebase Project**:
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and give it a name (e.g., "DriftBoard").
    *   You can disable Google Analytics for this project if you wish.

2.  **Enable Authentication Providers**:
    *   In the project dashboard, go to **Build > Authentication**.
    *   Click "Get started".
    *   In the "Sign-in method" tab, enable the providers you want to support (e.g., **Google** and **GitHub**). Follow the on-screen instructions for each.

3.  **Register Your Web App**:
    *   Go to your Project Settings (click the gear icon next to "Project Overview").
    *   Under "Your apps", click the web icon (`</>`).
    *   Give your app a nickname (e.g., "DriftBoard Web") and click "Register app".
    *   Firebase will provide a `firebaseConfig` object. **Copy this object.** You will need it for your frontend application.

4.  **Generate Backend Service Account Credentials**:
    *   In your Project Settings, go to the **Service accounts** tab.
    *   Click the "Generate new private key" button.
    *   This will download a JSON file. **Rename this file to `firebase-service-account.json`** and place it in a secure location in your backend directory (ensure it's added to `.gitignore`). This file gives your backend server admin access to your Firebase project.

---

## 3. Internal Setup (Codebase)

### Frontend (React + Vite)

1.  **Install Firebase SDK**:
    ```bash
    npm install firebase
    ```

2.  **Initialize Firebase**:
    *   Create a new file: `src/frontend/src/firebase.ts`.
    *   Add the `firebaseConfig` object you copied earlier.

    ```typescript
    // src/frontend/src/firebase.ts
    import { initializeApp } from 'firebase/app';
    import { getAuth } from 'firebase/auth';

    const firebaseConfig = {
      apiKey: "...",
      authDomain: "...",
      projectId: "...",
      storageBucket: "...",
      messagingSenderId: "...",
      appId: "..."
    };

    const app = initializeApp(firebaseConfig);
    export const auth = getAuth(app);
    ```

3.  **Integrate with RTK Query**:
    *   Update your RTK Query API definition to automatically add the auth token to every request.

    ```typescript
    // src/frontend/src/store/api.ts (or similar)
    import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
    import { auth } from '../firebase'; // Adjust path

    export const baseQuery = fetchBaseQuery({
      baseUrl: '/api',
      prepareHeaders: async (headers) => {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      },
    });
    ```

4.  **Create Auth Components**:
    *   Implement a `LoginPage.tsx` with "Sign in" buttons.
    *   Create an `AuthGate` or `ProtectedRoute` component that uses `onAuthStateChanged` from the Firebase SDK to listen to the user's auth state and redirect them appropriately.

### Backend (Express.js)

1.  **Install Firebase Admin SDK**:
    ```bash
    # In your src/backend directory
    npm install firebase-admin
    ```

2.  **Initialize Admin SDK**:
    *   Update your main server file or a dedicated config file.

    ```typescript
    // src/backend/server.ts (or a new src/backend/firebase.ts)
    import * as admin from 'firebase-admin';

    // IMPORTANT: Place the downloaded JSON file in your backend directory
    const serviceAccount = require('./firebase-service-account.json'); // Adjust path

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    ```

3.  **Create Authentication Middleware**:
    *   This middleware will protect your API routes.

    ```typescript
    // src/backend/middleware/authMiddleware.ts
    import { Request, Response, NextFunction } from 'express';
    import * as admin from 'firebase-admin';

    export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split('Bearer ')[1];

      if (!token) {
        return res.status(401).send({ error: 'Unauthorized: No token provided' });
      }

      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        // You can augment the Request type to include `user`
        (req as any).user = decodedToken;
        next();
      } catch (error) {
        console.error('Error verifying auth token:', error);
        return res.status(403).send({ error: 'Forbidden: Invalid token' });
      }
    };
    ```

4.  **Protect Routes**:
    *   Apply the middleware to all routes that require authentication.

    ```typescript
    // src/backend/routes/boards.ts
    import { Router } from 'express';
    import { authMiddleware } from '../middleware/authMiddleware';

    const router = Router();
    router.use(authMiddleware); // Protect all board routes

    // All handlers below this line will have access to req.user
    router.get('/', getBoardsHandler);
    ```

---

## 4. VS Code Extensions for Firebase

While there isn't a dedicated MCP tool specifically for Firebase, you can significantly improve your workflow in VS Code with the right extensions.

-   **Firebase** (by Google, ID: `google.firebase-vscode`): This is the official extension. It helps you view and manage your Firebase project directly from the editor, including emulator management and deploying security rules.
-   **DotENV** (ID: `mikestead.dotenv`): Useful for managing environment variables, which you'll use to store your Firebase config securely instead of hardcoding it.

I recommend installing the official **Firebase** extension to streamline development.
