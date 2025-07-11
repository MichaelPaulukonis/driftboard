# React Component Architecture in DriftBoard

DriftBoard follows a structured and scalable component architecture designed to keep the codebase organized, maintainable, and easy to navigate. This document outlines the different types of components and their roles.

## Core Principles

- **Separation of Concerns**: Components are organized based on their function (UI, layout, pages, features).
- **Composition over Inheritance**: We build complex UIs by composing smaller, single-purpose components.
- **Reusability**: Common UI elements are abstracted into reusable components to ensure consistency and reduce duplication.

## Component Directory Structure

All frontend components are located in `/src/frontend/src/components/`.

### 1. UI Components (`components/ui/`)

- **Purpose**: These are the foundational, "dumb" building blocks of our application's UI. They are highly reusable and have no knowledge of the application's business logic.
- **Source**: Most of these components are from the **ShadCN/UI** library, which provides unstyled, accessible primitives.
- **Examples**: `Button.tsx`, `Card.tsx`, `Dialog.tsx`, `Input.tsx`.
- **Guidelines**:
    - They should be styled with Tailwind CSS.
    - They receive all data and callbacks via props.
    - They should not contain any application-specific logic or fetch data.

### 2. Kanban Components (`components/kanban/`)

- **Purpose**: These are feature-specific components that are directly related to the Kanban board functionality. They often compose smaller UI components to build more complex features.
- **Examples**: `Board.tsx`, `List.tsx`, `Card.tsx` (the Kanban card, not the UI primitive), `BoardList.tsx`.
- **Guidelines**:
    - These components might contain some business logic related to the Kanban feature.
    - They interact with the Redux store to get data or dispatch actions.
    - They are the core visual elements of the main application interface.

### 3. Form Components (`components/forms/`)

- **Purpose**: Reusable forms for creating and editing data, such as boards and cards.
- **Examples**: `BoardForm.tsx`, `CardForm.tsx`.
- **Guidelines**:
    - They manage their own local form state (e.g., using `useState` or a library like `react-hook-form`).
    - They receive an `onSubmit` callback from their parent component to handle the data submission.

### 4. Layout Components (`components/layout/`)

- **Purpose**: These components define the overall structure and layout of the application.
- **Examples**: `Header.tsx`, `Sidebar.tsx`, `AppLayout.tsx`.
- **Guidelines**:
    - They often contain the main navigation elements.
    - `AppLayout.tsx` typically wraps the page content, providing a consistent look and feel across the application.

### 5. Page Components (`pages/`)

- **Purpose**: Each file in this directory corresponds to a specific route or page in the application. They are the top-level components for a given view.
- **Examples**: `BoardsPage.tsx`, `BoardDetailPage.tsx`, `LoginPage.tsx`.
- **Guidelines**:
    - They are responsible for fetching the initial data required for the page, usually via RTK Query hooks.
    - They compose layout, kanban, and UI components to build the complete page.
    - They connect the different parts of the application together.

### 6. Higher-Order & Special Components

- **`ProtectedRoute.tsx`**: A component that wraps other components to restrict access to authenticated users only. It checks the auth state from the Redux store and redirects to the login page if the user is not logged in.
