import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/backend/services/database.js';

/**
 * Unit-style tests for BoardMembership and Role behavior.
 * Focus: data relationships and access queries (without hitting HTTP routes).
 */

describe('BoardMembership & Role', () => {
  let userOwner: any;
  let userEditor: any;
  let board: any;

  beforeAll(async () => {
    // Create two users
    userOwner = await prisma.user.create({
      data: { email: `owner-${Date.now()}@example.com`, name: 'Owner User' },
    });
    userEditor = await prisma.user.create({
      data: { email: `editor-${Date.now()}@example.com`, name: 'Editor User' },
    });

    // Create a board owned by userOwner and add memberships (OWNER for creator, EDITOR for collaborator)
    board = await prisma.board.create({
      data: {
        name: 'Membership Test Board',
        userId: userOwner.userId,
        memberships: {
          create: [
            { userId: userOwner.userId, role: 'OWNER' },
            { userId: userEditor.userId, role: 'EDITOR' },
          ],
        },
      },
      include: { memberships: true },
    });
  });

  afterAll(async () => {
    await prisma.board.deleteMany({ where: { boardId: board.boardId } });
    await prisma.user.deleteMany({ where: { id: { in: [userOwner.id, userEditor.id] } } });
  });

  it('creates memberships with correct roles', async () => {
    const owners = board.memberships.filter((m: any) => m.role === 'OWNER');
    const editors = board.memberships.filter((m: any) => m.role === 'EDITOR');
    expect(owners.length).toBe(1);
    expect(editors.length).toBe(1);
    expect(owners[0].userId).toBe(userOwner.userId);
    expect(editors[0].userId).toBe(userEditor.userId);
  });

  it('allows board discovery via memberships OR creator ownership', async () => {
    const whereForOwner = {
      status: 'ACTIVE' as const,
      OR: [
        { memberships: { some: { userId: userOwner.userId } } },
        { userId: userOwner.userId },
      ],
    };
    const whereForEditor = {
      status: 'ACTIVE' as const,
      OR: [
        { memberships: { some: { userId: userEditor.userId } } },
        { userId: userEditor.userId },
      ],
    };

    const ownerBoards = await prisma.board.findMany({ where: whereForOwner });
    const editorBoards = await prisma.board.findMany({ where: whereForEditor });

    expect(ownerBoards.map(b => b.boardId)).toContain(board.boardId);
    expect(editorBoards.map(b => b.boardId)).toContain(board.boardId);
  });

  it('backfills OWNER for legacy boards without membership', async () => {
    // Create a legacy board without memberships
    const legacyBoard = await prisma.board.create({
      data: { name: 'Legacy Board', userId: userOwner.userId },
    });

    // Simulate backfill logic
    await prisma.boardMembership.upsert({
      where: { userId_boardId: { userId: userOwner.userId, boardId: legacyBoard.boardId } },
      update: { role: 'OWNER' },
      create: { userId: userOwner.userId, boardId: legacyBoard.boardId, role: 'OWNER' },
    });

    const memberships = await prisma.boardMembership.findMany({
      where: { boardId: legacyBoard.boardId },
    });

    expect(memberships.some(m => m.userId === userOwner.userId && m.role === 'OWNER')).toBe(true);

    // Cleanup legacy board
    await prisma.board.delete({ where: { id: legacyBoard.id } });
  });
});
