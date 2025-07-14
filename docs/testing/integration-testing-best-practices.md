# Integration Testing Best Practices

This guide outlines best practices and common pitfalls for writing integration tests in the DriftBoard project, based on lessons learned from recent debugging sessions. Following these guidelines will help create more robust, reliable, and maintainable tests.

## 1. Test Setup: Scaffolding vs. End-to-End Calls

**DON'T rely on a long chain of API calls to set up test state.**

-   **Problem**: Tests that call `POST /users`, then `POST /boards`, then `POST /lists` just to test a card feature become brittle. A failure in the board creation API will cause all card tests to fail, making it difficult to pinpoint the actual bug.
-   **Example (to avoid)**:
    ```typescript
    // in cards.test.ts
    beforeAll(async () => {
      // Creates dependency on the board and list creation endpoints
      const boardResponse = await request.post('/api/boards').send(...);
      const listResponse = await request.post(`/api/boards/${boardResponse.body.data.boardId}/lists`).send(...);
      // ... now we can finally create a card
    });
    ```

**DO scaffold required data directly in the database using Prisma for isolation.**

-   **Benefit**: This isolates the test to the specific component or API endpoint under test. It makes tests faster, more reliable, and easier to debug because failures are localized.
-   **Example (recommended)**:
    ```typescript
    // in lists.test.ts
    let testUser: User;
    let testBoard: Board;

    beforeAll(async () => {
      // Use Prisma to create only the necessary prerequisite data
      testUser = await prisma.user.create({ data: { ... } });
      testBoard = await prisma.board.create({ data: { userId: testUser.id, ... } });
    });
    ```

## 2. Authentication in Tests

**DON'T mock authentication with simple, non-standard headers or static tokens.**

-   **Problem**: Using a simple header like `x-test-user-id` or a static token string requires custom, non-production logic in your authentication middleware, which means you aren't testing the real authentication path.

**DO use a realistic, JWT-based authentication mock for the test environment.**

-   **Benefit**: This allows the test environment to closely mimic the production authentication flow without depending on an external service (like Firebase Auth).
-   **Implementation**:
    1.  Use a library like `jsonwebtoken` to generate valid tokens in a test helper (`tests/helpers.ts`).
    2.  Use a secret key from environment variables (`TEST_JWT_SECRET`) for signing.
    3.  In your `authMiddleware.ts`, check for `process.env.NODE_ENV === 'test'` and use `jwt.verify()` to validate the token, bypassing the live service call.

    ```typescript
    // helpers.ts
    export const getAuthHeaders = (user: { userId: string }) => {
      const token = jwt.sign({ uid: user.userId }, TEST_JWT_SECRET);
      return { Authorization: `Bearer ${token}` };
    };
    ```

## 3. Handling IDs (Stable vs. Version-Specific)

**DON'T mix up internal, version-specific database IDs (e.g., `id`) and stable, public-facing IDs (e.g., `boardId`, `cardId`).**

-   **Problem**: Using an auto-incrementing or version-specific `id` in public API routes (`/api/boards/:id`) is a bug. These IDs are implementation details and can change. API clients should only ever use the stable CUIDs (`boardId`, etc.).

**DO consistently use the stable, public-facing IDs in all API route parameters.**

-   **Benefit**: Provides a stable, predictable API contract for clients.
-   **Example**:
    -   **Correct**: `router.get('/:boardId', ...)` where `boardId` is the CUID.
    -   **Incorrect**: `router.get('/:id', ...)` where `id` is the internal primary key.

## 4. Writing Assertions

**DON'T write vague assertions.**

-   **Problem**: An assertion like `expect(response.body.data.listId).not.toBe(oldListId)` confirms a change happened, but not that the *correct* change happened.

**DO write specific and comprehensive assertions.**

-   **Benefit**: Ensures the system is in the exact state you expect after an operation.
-   **Example**:
    ```typescript
    // Test moving a card
    const moveResponse = await request.put(`/api/cards/${cardId}/move`).send({ listId: newList.id, position: 1 });

    // Specific assertion (recommended)
    expect(moveResponse.body.data.listId).toBe(newList.id); // Assert it's in the correct new list
    expect(moveResponse.body.data.position).toBe(1); // Assert it's at the correct new position
    ```

## 5. Prisma and TypeScript Types

**DON'T create manual type definitions for Prisma models if you can avoid it.**

-   **Problem**: Manually defining `interface TestUser { ... }` can easily fall out of sync with your `schema.prisma`, leading to type errors.

**DO rely on Prisma-generated types whenever possible.**

-   **Benefit**: Your types are always up-to-date with your database schema.
-   **Implementation**:
    1.  Ensure `prisma generate` has been run after any schema change.
    2.  Import types directly from the client: `import { User, Board } from '@prisma/client';`
    3.  If you need the type for a model with relations included, use `Prisma.UserGetPayload`.
        ```typescript
        import { Prisma } from '@prisma/client';

        const userWithBoardsPayload = Prisma.validator<Prisma.UserArgs>()({
          include: { boards: true },
        });

        type UserWithBoards = Prisma.UserGetPayload<typeof userWithBoardsPayload>;
        ```

By adhering to these practices, our integration tests will become a more valuable asset for ensuring application quality and preventing regressions.
