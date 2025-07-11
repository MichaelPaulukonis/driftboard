import { Router, Request, Response, NextFunction } from 'express';
import {
  ApiResponse,
  UpdateListDto,
  List,
  MoveListDto,
} from '../../shared/types/index.js';
import { prisma } from '../services/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

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

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'List ID is required',
      });
      return;
    }

    const list = await prisma.list.findUnique({
      where: { id },
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

    const updatedList = await prisma.list.update({
      where: { id },
      data: { name: name.trim() },
      include: {
        cards: {
          orderBy: { position: 'asc' },
          include: { labels: true },
        },
      },
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
router.put('/:id/move', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { position }: MoveListDto = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'List ID is required',
      });
      return;
    }

    if (position === undefined || position <= 0) {
      res.status(400).json({
        success: false,
        error: 'A valid new position is required',
      });
      return;
    }

    const movedList = await prisma.list.update({
      where: { id },
      data: { position },
      include: {
        cards: {
          orderBy: { position: 'asc' },
          include: { labels: true },
        },
      },
    });

    const response: ApiResponse<List> = {
      success: true,
      data: movedList,
      message: 'List moved successfully',
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
 * DELETE /api/lists/:id
 * Delete a list and all its cards
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'List ID is required',
      });
      return;
    }

    // Check if list exists
    const existingList = await prisma.list.findUnique({
      where: { id },
    });

    if (!existingList) {
      res.status(404).json({
        success: false,
        error: 'List not found',
      });
      return;
    }

    // Delete the list (cards will be deleted automatically due to cascade)
    await prisma.list.delete({
      where: { id },
    });

    // Reorder remaining lists to fill the gap
    await prisma.list.updateMany({
      where: {
        boardId: existingList.boardId,
        position: {
          gt: existingList.position,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'List deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/lists/:id/cards
 * Create a new card in a list
 */
router.post('/:id/cards', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: listId } = req.params;
    const { title, description, position } = req.body;

    if (!listId) {
      res.status(400).json({
        success: false,
        error: 'List ID is required',
      });
      return;
    }

    if (!title || title.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Card title is required',
      });
      return;
    }

    // Check if list exists
    const list = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      res.status(404).json({
        success: false,
        error: 'List not found',
      });
      return;
    }

    // Calculate position if not provided
    let cardPosition = position;
    if (cardPosition === undefined) {
      const maxPositionResult = await prisma.card.aggregate({
        where: { listId },
        _max: { position: true },
      });
      cardPosition = (maxPositionResult._max.position ?? 0) + 1000;
    }

    const card = await prisma.card.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        listId,
        position: cardPosition,
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
