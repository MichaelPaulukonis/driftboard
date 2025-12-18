---
description: Guidelines for creating and maintaining VS Code rules to ensure consistency and effectiveness.
applyTo: ".github/instructions/*.instructions.md"
---

- **Required Rule Structure:**
  ```markdown
  ---
  description: Clear, one-line description of what the rule enforces
  globs: path/to/files/*.ext, other/path/**/*
  alwaysApply: boolean
  ---

  - **Main Points in Bold**
    - Sub-points with details
    - Examples and explanations
  ```

- **File References:**
  - Use `[filename](mdc:path/to/file)` ([filename](mdc:filename)) to reference files
  - Example: [prisma.instructions.md](.github/instructions/prisma.instructions.md) for rule references
  - Example: [schema.prisma](mdc:prisma/schema.prisma) for code references

- **Code Examples:**
  - Use language-specific code blocks
  ```typescript
  // ✅ DO: Show good examples
  const goodExample = true;
  
  // ❌ DON'T: Show anti-patterns
  const badExample = false;
  ```

- **Rule Content Guidelines:**
  - Start with high-level overview
  - Include specific, actionable requirements
  - Show examples of correct implementation
  - Reference existing code when possible
  - Keep rules DRY by referencing other rules

- **Rule Maintenance:**
  - Update rules when new patterns emerge
  - Add examples from actual codebase
  - Remove outdated patterns
  - Cross-reference related rules

- **Best Practices:**
  - Use bullet points for clarity
  - Keep descriptions concise
  - Include both DO and DON'T examples
  - Reference actual code over theoretical examples
  - Use consistent formatting across rules 

---
description: Enforce membership-based access checks for boards and nested resources
globs: src/backend/routes/**/*.ts
alwaysApply: true
---

- **Use membership-aware access filters**
  - DO: Filter access with `OR` on `Board.memberships.some({ userId })` or `Board.userId`
  - DON'T: Rely solely on `board.userId` for authorization checks
  - Example (Prisma):
    ```typescript
    const where = {
      status: 'ACTIVE',
      OR: [
        { memberships: { some: { userId } } },
        { userId },
      ],
    };
    const boards = await prisma.board.findMany({ where });
    ```

- **Propagate memberships across versioned boards**
  - DO: Recreate `BoardMembership` records when creating a new board version
  - DO: Backfill OWNER membership for legacy boards that lack memberships
  - Example (Update flow):
    ```typescript
    const membershipPayload = existing.memberships.map(m => ({ userId: m.userId, role: m.role }));
    if (!membershipPayload.some(m => m.userId === existing.userId)) {
      membershipPayload.push({ userId: existing.userId, role: 'OWNER' });
    }
    await tx.board.create({ data: { memberships: { create: membershipPayload }, /* ... */ } });
    ```

- **Restrict destructive actions to owners**
  - DO: Require `role === 'OWNER'` to delete a board or manage invitations
  - DO: Upsert OWNER membership for legacy boards when the creator acts
  - Example (Delete guard):
    ```typescript
    let membership = board.memberships.find(m => m.userId === userId);
    if (!membership && board.userId === userId) {
      membership = await prisma.boardMembership.upsert({
        where: { userId_boardId: { userId, boardId: board.boardId } },
        update: { role: 'OWNER' },
        create: { userId, boardId: board.boardId, role: 'OWNER' },
      });
    }
    if (!membership || membership.role !== 'OWNER') throw new AppError('FORBIDDEN', 403);
    ```

- **Nested resources must inherit board access rules**
  - DO: Apply the membership-aware filter to `List` and `Card` via `list.board`
  - Example:
    ```typescript
    const list = await prisma.list.findFirst({
      where: {
        listId,
        status: 'ACTIVE',
        board: { status: 'ACTIVE', OR: [{ memberships: { some: { userId } } }, { userId }] },
      },
    });
    ```