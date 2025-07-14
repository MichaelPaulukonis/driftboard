import { Router, Request, Response, NextFunction } from 'express';
import {
  ApiResponse,
  UpdateListDto,
  List,
  MoveListDto,
  CreateCardDto,
} from '../../shared/types/index.js';
import { prisma } from '../services/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/lists/:id
 * Get a specific list with its cards
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'List ID is required',
      });
      return;
    }

    const list = await prisma.list.findFirst({
      where: {
        listId: id,
        status: 'ACTIVE',
        board: {
          userId,
          status: 'ACTIVE',
        },
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

    if (!list) {
      res.status(404).json({
        success: false,
        error: 'List not found',
      });
      return;
    }

    const response: ApiResponse<List> = {
      success: true,
      data: list,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/lists/:id
 * Update a list (name only)
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name }: UpdateListDto = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'List ID is required',
      });
      return;
    }

    // Validate input
    if (name === undefined || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'List name cannot be empty',
      });
      return;
    }

    const existingList = await prisma.list.findFirst({
      where: { 
        listId: id, 
        status: 'ACTIVE',
        board: {
          userId,
          status: 'ACTIVE'
        }
      },
    });

    if (!existingList) {
      res.status(404).json({ success: false, error: 'List not found' });
      return;
    }

    const updatedList = await prisma.$transaction(async (tx) => {
      await tx.list.update({
        where: { id: existingList.id },
        data: { status: 'INACTIVE' },
      });

      const { id: oldId, listId: oldListId, boardId: oldBoardId, ...restOfList } = existingList;

      const newList = await tx.list.create({
        data: {
          ...restOfList,
          version: existingList.version + 1,
          name: name.trim(),
          board: {
            connect: { boardId: existingList.boardId },
          },
          position: existingList.position,
          status: 'ACTIVE',
        },
        include: {
          cards: {
            orderBy: { position: 'asc' },
            include: { labels: true },
          },
        },
      });

      // Update cards to point to the new list version
      await tx.card.updateMany({
        where: { listId: existingList.id },
        data: { listId: newList.id },
      });

      return newList;
    });

    const response: ApiResponse<List> = {
      success: true,
      data: updatedList,
      message: 'List updated successfully',
    };

    res.json(response);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      res.status(404).json({ success: false, error: 'List not found' });
    } else {
      next(error);
    }
  }
});

/**
 * PUT /api/lists/:id/move
 * Move a list to a new position
 */
router.put('/:id/move', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listId = req.params.id;
    const { position } = req.body as MoveListDto;
    const userId = req.user?.uid;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!listId) {
      throw new AppError('List ID is required', 400, 'INVALID_INPUT');
    }

    const existingList = await prisma.list.findFirst({
      where: {
        listId: listId,
        status: 'ACTIVE',
        board: {
          userId,
          status: 'ACTIVE',
        },
      },
    });

    if (!existingList) {
      throw new AppError('List not found or access denied', 404, 'LIST_NOT_FOUND');
    }

    const updatedList = await prisma.$transaction(async (tx) => {
      await tx.list.update({
        where: { id: existingList.id },
        data: { status: 'INACTIVE' },
      });

      const { id: oldId, listId: oldListId, boardId: oldBoardId, ...restOfList } = existingList;

      const newList = await tx.list.create({
        data: {
          ...restOfList,
          version: existingList.version + 1,
          status: 'ACTIVE',
          position: position,
          board: {
            connect: { boardId: oldBoardId },
          },
        },
      });

      // Update cards to point to the new list version
      await tx.card.updateMany({
        where: { listId: existingList.id },
        data: { listId: newList.id },
      });
      
      return newList;
    });

    const response: ApiResponse<List> = {
      success: true,
      data: updatedList,
      message: 'List moved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/lists/:id
 * Delete a list and all its cards
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const listId = req.params.id;
    const userId = req.user?.uid;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!listId) {
      res.status(400).json({
        success: false,
        error: 'List ID is required',
      });
      return;
    }

    // Check if list exists
    const existingList = await prisma.list.findFirst({
      where: { 
        listId: listId, 
        status: 'ACTIVE',
        board: {
          userId,
          status: 'ACTIVE'
        }
      },
    });

    if (!existingList) {
      res.status(404).json({ success: false, error: 'List not found' });
      return;
    }

    // "Delete" the list by marking it as inactive
    await prisma.list.update({
      where: { id: existingList.id },
      data: { status: 'INACTIVE' },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/lists/:id/cards
 * Create a new card in a list
 */
router.post('/:id/cards', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const listId = req.params.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!listId) {
      throw new AppError('List ID is required', 400, 'INVALID_INPUT');
    }

    const { title, description, position } = req.body as CreateCardDto;

    if (!title) {
      throw new AppError('Card title is required', 400, 'INVALID_INPUT');
    }

    // Verify list exists and belongs to the user (via the board)
    const list = await prisma.list.findFirst({
      where: {
        listId: listId,
        status: 'ACTIVE',
        board: {
          userId,
          status: 'ACTIVE',
        },
      },
    });

    if (!list) {
      throw new AppError('List not found or access denied', 404, 'LIST_NOT_FOUND');
    }

    let cardPosition = position;
    if (cardPosition === undefined) {
      const maxPosition = await prisma.card.aggregate({
        where: { listId: list.id, status: 'ACTIVE' },
        _max: { position: true },
      });
      cardPosition = (maxPosition._max.position ?? -1) + 1;
    }

    const card = await prisma.card.create({
      data: {
        title,
        description: description ?? null,
        position: cardPosition,
        list: {
          connect: { id: list.id },
        },
        version: 1,
        status: 'ACTIVE',
      },
      include: {
        labels: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: card,
      message: 'Card created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

export { router as listsRouter };
