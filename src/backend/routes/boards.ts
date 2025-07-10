import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { ApiResponse, CreateBoardDto, UpdateBoardDto, BoardWithDetails } from '../../shared/types/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * Get all boards for the authenticated user
 * GET /api/boards
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const boards = await prisma.board.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
      include: {
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
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
      data: boards,
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
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const boardId = req.params.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    const board = await prisma.board.findFirst({
      where: { 
        id: boardId,
        userId,
      },
      include: {
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
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
    const userId = req.user?.uid;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { name, description }: CreateBoardDto = req.body;

    if (!name || name.trim().length === 0) {
      throw new AppError('Board name is required', 400, 'MISSING_BOARD_NAME');
    }

    // Get the next position for the board
    const maxPosition = await prisma.board.aggregate({
      where: { userId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    const board = await prisma.board.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId,
        position,
      },
      include: {
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                labels: true,
              },
            },
          },
        },
      },
    });

    const response: ApiResponse<BoardWithDetails> = {
      success: true,
      data: board,
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
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const boardId = req.params.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    const { name, description, position }: UpdateBoardDto = req.body;

    // Verify board exists and belongs to user
    const existingBoard = await prisma.board.findFirst({
      where: { 
        id: boardId,
        userId,
      },
    });

    if (!existingBoard) {
      throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');
    }

    const board = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(position !== undefined && { position }),
      },
      include: {
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                labels: true,
              },
            },
          },
        },
      },
    });

    const response: ApiResponse<BoardWithDetails> = {
      success: true,
      data: board as BoardWithDetails,
      message: 'Board updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a board
 * DELETE /api/boards/:id
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const boardId = req.params.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    // Verify board exists and belongs to user
    const existingBoard = await prisma.board.findFirst({
      where: { 
        id: boardId,
        userId,
      },
    });

    if (!existingBoard) {
      throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Board deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a list in a board
 * POST /api/boards/:id/lists
 */
router.post('/:id/lists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const boardId = req.params.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    const { name, position }: { name: string; position?: number } = req.body;

    if (!name || name.trim().length === 0) {
      throw new AppError('List name is required', 400, 'MISSING_LIST_NAME');
    }

    // Verify board exists and belongs to user
    const board = await prisma.board.findFirst({
      where: { 
        id: boardId,
        userId,
      },
    });

    if (!board) {
      throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');
    }

    // Calculate position if not provided
    let listPosition = position;
    if (listPosition === undefined) {
      const maxPosition = await prisma.list.aggregate({
        where: { boardId },
        _max: { position: true },
      });
      listPosition = (maxPosition._max?.position ?? -1) + 1;
    } else {
      // If position is specified, shift existing lists
      await prisma.list.updateMany({
        where: {
          boardId,
          position: {
            gte: listPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    }

    const list = await prisma.list.create({
      data: {
        name: name.trim(),
        boardId,
        position: listPosition,
      },
      include: {
        cards: {
          orderBy: { position: 'asc' },
          include: {
            labels: true,
          },
        },
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
