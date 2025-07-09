import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse, UpdateCardDto, MoveCardDto, Card } from '../../shared/types/index.js';
import { prisma } from '../services/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/cards/:id
 * Get a specific card with its details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Card ID is required',
      });
      return;
    }

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        labels: true,
        activities: true,
      },
    });

    if (!card) {
      res.status(404).json({
        success: false,
        error: 'Card not found',
      });
      return;
    }

    const response: ApiResponse<Card> = {
      success: true,
      data: card,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/cards/:id
 * Update a card (title, description, position, dueDate)
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateCardDto = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Card ID is required',
      });
      return;
    }

    // Validate input
    if (updateData.title !== undefined && (!updateData.title || updateData.title.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: 'Card title cannot be empty',
      });
      return;
    }

    // Check if card exists
    const existingCard = await prisma.card.findUnique({
      where: { id },
    });

    if (!existingCard) {
      res.status(404).json({
        success: false,
        error: 'Card not found',
      });
      return;
    }

    // If position is being updated within the same list, handle reordering
    if (updateData.position !== undefined && updateData.position !== existingCard.position && !updateData.listId) {
      const oldPosition = existingCard.position;
      const newPosition = updateData.position;

      // Update positions of other cards in the same list
      if (newPosition < oldPosition) {
        // Moving up - shift cards down
        await prisma.card.updateMany({
          where: {
            listId: existingCard.listId,
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
        // Moving down - shift cards up
        await prisma.card.updateMany({
          where: {
            listId: existingCard.listId,
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

    // Update the card
    const updatedCard = await prisma.card.update({
      where: { id },
      data: {
        ...(updateData.title && { title: updateData.title.trim() }),
        ...(updateData.description !== undefined && { description: updateData.description?.trim() || null }),
        ...(updateData.position !== undefined && { position: updateData.position }),
        ...(updateData.dueDate !== undefined && { dueDate: updateData.dueDate }),
      },
      include: {
        labels: true,
        activities: true,
      },
    });

    const response: ApiResponse<Card> = {
      success: true,
      data: updatedCard,
      message: 'Card updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/cards/:id/move
 * Move a card to a different list or position
 */
router.put('/:id/move', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { listId, position }: { listId: string; position?: number } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Card ID is required',
      });
      return;
    }

    if (!listId) {
      res.status(400).json({
        success: false,
        error: 'Target list ID is required',
      });
      return;
    }

    // Check if card exists
    const existingCard = await prisma.card.findUnique({
      where: { id },
    });

    if (!existingCard) {
      res.status(404).json({
        success: false,
        error: 'Card not found',
      });
      return;
    }

    // Check if target list exists
    const targetList = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!targetList) {
      res.status(404).json({
        success: false,
        error: 'Target list not found',
      });
      return;
    }

    // Calculate new position if not provided
    let newPosition = position;
    if (newPosition === undefined) {
      const maxPosition = await prisma.card.aggregate({
        where: { listId },
        _max: { position: true },
      });
      newPosition = (maxPosition._max?.position ?? -1) + 1;
    } else {
      // Shift existing cards in target list to make room
      await prisma.card.updateMany({
        where: {
          listId,
          position: {
            gte: newPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    }

    // Remove gap in source list if moving to different list
    if (existingCard.listId !== listId) {
      await prisma.card.updateMany({
        where: {
          listId: existingCard.listId,
          position: {
            gt: existingCard.position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
    }

    // Update the card with new list and position
    const updatedCard = await prisma.card.update({
      where: { id },
      data: {
        listId,
        position: newPosition,
      },
      include: {
        labels: true,
        activities: true,
      },
    });

    const response: ApiResponse<Card> = {
      success: true,
      data: updatedCard,
      message: 'Card moved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cards/:id
 * Delete a card
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Card ID is required',
      });
      return;
    }

    // Check if card exists
    const existingCard = await prisma.card.findUnique({
      where: { id },
    });

    if (!existingCard) {
      res.status(404).json({
        success: false,
        error: 'Card not found',
      });
      return;
    }

    // Delete the card (labels and activities will be deleted automatically due to cascade)
    await prisma.card.delete({
      where: { id },
    });

    // Reorder remaining cards to fill the gap
    await prisma.card.updateMany({
      where: {
        listId: existingCard.listId,
        position: {
          gt: existingCard.position,
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
      message: 'Card deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export { router as cardsRouter };
