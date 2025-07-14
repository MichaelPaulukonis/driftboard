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
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const boards = await prisma.board.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        lists: {
          where: { status: 'ACTIVE' }, // Filter for active lists
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { status: 'ACTIVE' }, // Filter for active cards
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
    const userId = req.user?.id;
    const { boardId } = req.params;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    const board = await prisma.board.findFirst({
      where: { 
        boardId: boardId,
        userId,
        status: 'ACTIVE'
      },
      include: {
        lists: {
          where: { status: 'ACTIVE' }, // Filter for active lists
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { status: 'ACTIVE' }, // Filter for active cards
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
    const userId = req.user?.uid; // Use the persistent uid from the auth middleware
    if (!userId) {
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
        userId: userId, // Direct assignment of the foreign key
      },
      include: {
        lists: {
          include: {
            cards: {
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
    const userId = req.user?.id;
    const { boardId } = req.params;
    const { name, description } = req.body as UpdateBoardDto;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    const existingBoard = await prisma.board.findFirst({
      where: { boardId: boardId, userId, status: 'ACTIVE' },
    });

    if (!existingBoard) {
      throw new AppError('Board not found or access denied', 404, 'BOARD_NOT_FOUND');
    }

    const updatedBoard = await prisma.$transaction(async (tx) => {
      await tx.board.update({
        where: { id: existingBoard.id },
        data: { status: 'INACTIVE' },
      });

      const newBoard = await tx.board.create({
        data: {
          boardId: existingBoard.boardId, // Copy the persistent ID
          version: existingBoard.version + 1,
          name: name ?? existingBoard.name,
          description: description ?? existingBoard.description,
          userId: existingBoard.userId,
          status: 'ACTIVE',
        },
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
 * Delete a board
 * DELETE /api/boards/:id
 */
router.delete('/:boardId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { boardId } = req.params;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!boardId) {
      throw new AppError('Board ID is required', 400, 'INVALID_INPUT');
    }

    const existingBoard = await prisma.board.findFirst({
      where: { 
        boardId: boardId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!existingBoard) {
      throw new AppError('Board not found or access denied', 404, 'BOARD_NOT_FOUND');
    }

    await prisma.board.update({
      where: { id: existingBoard.id },
      data: { status: 'INACTIVE' },
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
    const userId = req.user?.uid;
    const { boardId } = req.params;
    const { name, position } = req.body as CreateListDto;

    if (!userId) {
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
      where: { boardId, userId, status: 'ACTIVE' },
    });

    if (!board) {
      throw new AppError('Board not found', 404, 'BOARD_NOT_FOUND');
    }

    // Calculate position if not provided
    let listPosition = position;
    if (listPosition === undefined) {
      const maxPosition = await prisma.list.aggregate({
        where: { boardId: board.boardId, status: 'ACTIVE' },
        _max: { position: true },
      });
      listPosition = (maxPosition._max?.position ?? -1) + 1;
    }

    const list = await prisma.list.create({
      data: {
        name: name.trim(),
        boardId: board.boardId, // Direct assignment
        position: listPosition,
        version: 1,
        status: 'ACTIVE',
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
