import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse, UpdateCardDto, Card, MoveCardDto } from '../../shared/types/index.js';
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

    const card = await prisma.card.findFirst({
      where: { id, status: 'ACTIVE' },
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
      data: card as Card,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/cards/:id
 * Update a card (title, description, dueDate)
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, dueDate }: UpdateCardDto = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Card ID is required',
      });
      return;
    }

    // Validate input
    if (title !== undefined && (!title || title.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: 'Card title cannot be empty',
      });
      return;
    }

    const dataToUpdate: { title?: string; description?: string | null; dueDate?: Date | null } = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (description !== undefined) dataToUpdate.description = description;
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate;

    const existingCard = await prisma.card.findFirst({
      where: { id, status: 'ACTIVE' },
    });

    if (!existingCard) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }

    const updatedCard = await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: existingCard.id },
        data: { status: 'INACTIVE' },
      });

      return tx.card.create({
        data: {
          cardId: existingCard.cardId,
          version: existingCard.version + 1,
          title: title?.trim() ?? existingCard.title,
          description: description ?? existingCard.description,
          dueDate: dueDate ?? existingCard.dueDate,
          listId: existingCard.listId,
          position: existingCard.position,
        },
        include: {
          labels: true,
          activities: true,
        },
      });
    });

    const response: ApiResponse<Card> = {
      success: true,
      data: updatedCard as Card,
      message: 'Card updated successfully',
    };

    res.json(response);
  } catch (error) {
    // The 'findUnique' will throw an error if the card is not found,
    // which we can catch here.
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Card not found' });
    } else {
      next(error);
    }
  }
});

/**
 * PUT /api/cards/:id/move
 * Move a card to a new list and/or position
 */
router.put('/:id/move', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { listId, position }: MoveCardDto = req.body;

    if (!id) {
      res.status(400).json({ success: false, error: 'Card ID is required' });
      return;
    }

    if (!listId) {
      res.status(400).json({ success: false, error: 'Target list ID is required' });
      return;
    }

    if (position === undefined || position === null) {
      res.status(400).json({ success: false, error: 'Position is required' });
      return;
    }

    const existingCard = await prisma.card.findFirst({
      where: { id, status: 'ACTIVE' },
    });

    if (!existingCard) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }

    // Verify the target list exists
    const targetList = await prisma.list.findFirst({
      where: { id: listId, status: 'ACTIVE' },
    });

    if (!targetList) {
      res.status(404).json({ success: false, error: 'Target list not found' });
      return;
    }

    const updatedCard = await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: existingCard.id },
        data: { status: 'INACTIVE' },
      });

      return tx.card.create({
        data: {
          cardId: existingCard.cardId,
          version: existingCard.version + 1,
          title: existingCard.title,
          description: existingCard.description,
          dueDate: existingCard.dueDate,
          listId,
          position,
        },
      });
    });

    const response: ApiResponse<Card> = {
      success: true,
      data: updatedCard as Card,
      message: 'Card moved successfully',
    };

    res.json(response);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Card not found' });
    } else {
      next(error);
    }
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
    const existingCard = await prisma.card.findFirst({
      where: { id, status: 'ACTIVE' },
    });

    if (!existingCard) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }

    // "Delete" the card by marking it as inactive
    await prisma.card.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    // Reorder remaining cards to fill the gap
    await prisma.card.updateMany({
      where: {
        listId: existingCard.listId,
        status: 'ACTIVE',
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
