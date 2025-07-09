import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse, UpdateListDto, List } from '../../shared/types/index.js';
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
 * Update a list (name, position)
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateListDto = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'List ID is required',
      });
      return;
    }

    // Validate input
    if (updateData.name !== undefined && (!updateData.name || updateData.name.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: 'List name cannot be empty',
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

    // If position is being updated, handle reordering
    if (updateData.position !== undefined && updateData.position !== existingList.position) {
      // Calculate new positions for reordering
      const oldPosition = existingList.position;
      const newPosition = updateData.position;

      // Update positions of other lists
      if (newPosition < oldPosition) {
        // Moving up - shift lists down
        await prisma.list.updateMany({
          where: {
            boardId: existingList.boardId,
            position: {
              gte: newPosition,
              lt: oldPosition,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      } else {
        // Moving down - shift lists up
        await prisma.list.updateMany({
          where: {
            boardId: existingList.boardId,
            position: {
              gt: oldPosition,
              lte: newPosition,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      }
    }

    // Update the list
    const updatedList = await prisma.list.update({
      where: { id },
      data: {
        ...(updateData.name && { name: updateData.name.trim() }),
        ...(updateData.position !== undefined && { position: updateData.position }),
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

    const response: ApiResponse<List> = {
      success: true,
      data: updatedList,
      message: 'List updated successfully',
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
    const { title, description, position }: { title: string; description?: string; position?: number } = req.body;

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
      const maxPosition = await prisma.card.aggregate({
        where: { listId },
        _max: { position: true },
      });
      cardPosition = (maxPosition._max?.position ?? -1) + 1;
    } else {
      // If position is specified, shift existing cards
      await prisma.card.updateMany({
        where: {
          listId,
          position: {
            gte: cardPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
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
