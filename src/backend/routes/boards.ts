import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { ApiResponse, CreateBoardDto, UpdateBoardDto, BoardWithDetails, CreateListDto } from '../../shared/types/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * Get all boards for the authenticated user
 * GET /api/boards
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorId = req.user?.id;
    if (!authorId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const boards = await prisma.board.findMany({
      where: { authorId, status: 'ACTIVE' },
      include: {
        lists: {
          where: { status: 'ACTIVE' },
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { status: 'ACTIVE' },
              orderBy: { position: 'asc' },
              include: {
                labels: true,
              },
            },
          },
        },
      },
    });

    const response: ApiResponse<BoardWithDetails[]> = {
      success: true,
      data: boards as BoardWithDetails[],
      message: 'Boards retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Get a specific board by ID
 * GET /api/boards/:id
 */
router.get('/:boardId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorId = req.user?.id;
    const { boardId } = req.params;

    if (!authorId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    const board = await prisma.board.findFirst({
      where: { 
        boardId: boardId,
        authorId,
        status: 'ACTIVE'
      },
      include: {
        lists: {
          where: { status: 'ACTIVE' },
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { status: 'ACTIVE' },
              orderBy: { position: 'asc' },
              include: {
                labels: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');
    }

    const response: ApiResponse<BoardWithDetails> = {
      success: true,
      data: board as BoardWithDetails,
      message: 'Board retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new board
 * POST /api/boards
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorId = req.user?.id;
    if (!authorId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { name, description } = req.body as CreateBoardDto;

    if (!name) {
      throw new AppError('Board name is required', 400, 'INVALID_INPUT');
    }

    const board = await prisma.board.create({
      data: {
        name,
        description: description ?? null,
        authorId: authorId,
      },
      include: {
        lists: true,
      },
    });

    const response: ApiResponse<BoardWithDetails> = {
      success: true,
      data: board as BoardWithDetails,
      message: 'Board created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Update a board
 * PUT /api/boards/:id
 */
router.put('/:boardId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorId = req.user?.id;
    const { boardId } = req.params;
    const { name, description } = req.body as UpdateBoardDto;

    if (!authorId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    const existingBoard = await prisma.board.findFirst({
      where: { boardId: boardId, authorId, status: 'ACTIVE' },
    });

    if (!existingBoard) {
      throw new AppError('Board not found or access denied', 404, 'BOARD_NOT_FOUND');
    }

    const updatedBoard = await prisma.$transaction(async (tx) => {
      // 1. Deactivate the old board version
      await tx.board.update({
        where: { id: existingBoard.id },
        data: { status: 'INACTIVE' },
      });

      // 2. Create the new board version
      const newBoard = await tx.board.create({
        data: {
          boardId: existingBoard.boardId,
          version: existingBoard.version + 1,
          name: name ?? existingBoard.name,
          description: description ?? existingBoard.description,
          authorId: existingBoard.authorId,
          status: 'ACTIVE',
        },
      });

      // 3. Re-parent the lists to the new board version
      await tx.list.updateMany({
        where: { boardId: existingBoard.id },
        data: { boardId: newBoard.id },
      });

      return newBoard;
    });

    const response: ApiResponse<BoardWithDetails> = {
      success: true,
      data: updatedBoard as BoardWithDetails,
      message: 'Board updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a board (mark as inactive)
 * DELETE /api/boards/:id
 */
router.delete('/:boardId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorId = req.user?.id;
    const { boardId } = req.params;

    if (!authorId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    const existingBoard = await prisma.board.findFirst({
      where: { 
        boardId: boardId,
        authorId,
        status: 'ACTIVE',
      },
      include: {
        lists: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        }
      }
    });

    if (!existingBoard) {
      throw new AppError('Board not found or access denied', 404, 'BOARD_NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      const listIds = existingBoard.lists.map(list => list.id);
      
      // Mark all cards in the board's lists as inactive
      if (listIds.length > 0) {
        await tx.card.updateMany({
          where: { listId: { in: listIds } },
          data: { status: 'INACTIVE' },
        });
      }

      // Mark all lists in the board as inactive
      await tx.list.updateMany({
        where: { id: { in: listIds } },
        data: { status: 'INACTIVE' },
      });

      // Mark the board itself as inactive
      await tx.board.update({
        where: { id: existingBoard.id },
        data: { status: 'INACTIVE' },
      });
    });


    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new list in a board
 * POST /api/boards/:boardId/lists
 */
router.post('/:boardId/lists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorId = req.user?.id;
    const { boardId } = req.params;
    const { name, position } = req.body as CreateListDto;

    if (!authorId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }
    if (!name) {
      throw new AppError('List name is required', 400, 'INVALID_INPUT');
    }
    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    // Verify board exists and belongs to the user
    const board = await prisma.board.findFirst({
      where: { boardId, authorId, status: 'ACTIVE' },
    });

    if (!board) {
      throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');
    }

    // Calculate position if not provided
    let listPosition = position;
    if (listPosition === undefined) {
      const maxPosition = await prisma.list.aggregate({
        where: { boardId: board.id, status: 'ACTIVE' },
        _max: { position: true },
      });
      listPosition = (maxPosition._max?.position ?? -1) + 1;
    }

    const list = await prisma.list.create({
      data: {
        name: name.trim(),
        boardId: board.id, // Use the board's primary key
        position: listPosition,
      },
      include: {
        cards: true
      },
    });

    const response: ApiResponse = {
      success: true,
      data: list,
      message: 'List created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});


export { router as boardsRouter };
