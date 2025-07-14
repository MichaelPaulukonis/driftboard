import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse, UpdateCardDto, Card, MoveCardDto } from '../../shared/types/index.js';
import { prisma } from '../services/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { AppError } from '../middleware/errorHandler.js';

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
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Card ID is required',
      });
      return;
    }

    const card = await prisma.card.findFirst({
      where: {
        cardId: id,
        status: 'ACTIVE',
        list: {
          board: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
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
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

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
      where: {
        cardId: id,
        status: 'ACTIVE',
        list: {
          board: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
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
          list: {
            connect: { id: existingCard.listId },
          },
          position: existingCard.position,
          status: 'ACTIVE',
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
    const cardId = req.params.id;
    const { listId, position }: MoveCardDto = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!cardId) {
      throw new AppError('Card ID is required', 400, 'INVALID_INPUT');
    }

    if (!listId) {
      throw new AppError('Target list ID is required', 400, 'INVALID_INPUT');
    }

    if (position === undefined || position === null) {
      throw new AppError('Position is required', 400, 'INVALID_INPUT');
    }

    // 1. Find the existing card and verify ownership
    const existingCard = await prisma.card.findFirst({
      where: {
        cardId: cardId,
        status: 'ACTIVE',
        list: {
          board: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!existingCard) {
      throw new AppError('Card not found or access denied', 404, 'CARD_NOT_FOUND');
    }

    // 2. Verify the target list exists and belongs to the user
    const targetList = await prisma.list.findFirst({
      where: {
        listId: listId, // Find target list by its persistent listId
        status: 'ACTIVE',
        board: {
          user: {
            id: userId,
          },
          status: 'ACTIVE',
        },
      },
    });

    if (!targetList) {
      throw new AppError('Target list not found or access denied', 404, 'LIST_NOT_FOUND');
    }

    // 3. Perform the move in a transaction
    const movedCard = await prisma.$transaction(async (tx) => {
      // Deactivate the old card version
      await tx.card.update({
        where: { id: existingCard.id },
        data: { status: 'INACTIVE' },
      });

      // Create the new card version with updated position/list
      const { id: oldId, listId: oldListId, ...restOfCard } = existingCard;
      const newCard = await tx.card.create({
        data: {
          ...restOfCard,
          version: existingCard.version + 1,
          status: 'ACTIVE',
          position: position,
          list: {
            connect: { id: targetList.id },
          },
        },
      });
      return newCard;
    });

    const response: ApiResponse<Card> = {
      success: true,
      data: movedCard,
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
    const cardId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!cardId) {
      res.status(400).json({
        success: false,
        error: 'Card ID is required',
      });
      return;
    }

    // Check if card exists
    const existingCard = await prisma.card.findFirst({
      where: { 
        cardId: cardId, 
        status: 'ACTIVE',
        list: {
          board: {
            userId,
            status: 'ACTIVE'
          }
        }
      },
    });

    if (!existingCard) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }

    // "Delete" the card by marking it as inactive
    await prisma.card.update({
      where: { id: existingCard.id },
      data: { status: 'INACTIVE' },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as cardsRouter };
