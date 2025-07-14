import { useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { 
  useGetBoardByIdQuery, 
  useUpdateBoardMutation,
  useCreateListMutation, 
  useUpdateListMutation, 
  useDeleteListMutation,
  useCreateCardMutation, 
  useUpdateCardMutation, 
  useDeleteCardMutation,
  useMoveCardMutation,
  useMoveListMutation,
} from '../api/api';
import { Board as KanbanBoard } from '@/components/kanban/Board';
import { calculatePosition } from '@/utils/position';
import { Card } from '@/shared/types';

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: board, error, isLoading } = useGetBoardByIdQuery(id!, {
    skip: !id,
  });
  
  // RTK Query mutations
  const [updateBoard] = useUpdateBoardMutation();
  const [createList] = useCreateListMutation();
  const [updateList] = useUpdateListMutation();
  const [deleteList] = useDeleteListMutation();
  const [createCard] = useCreateCardMutation();
  const [updateCard] = useUpdateCardMutation();
  const [deleteCard] = useDeleteCardMutation();
  const [moveCard] = useMoveCardMutation();
  const [moveList] = useMoveListMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag needed to start
      },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !board) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    const activeType = active.data.current?.type;
    
    // Handle List Reordering
    if (activeType === 'List' && over) {
      const oldIndex = board.lists.findIndex(l => l.listId === activeId);
      const newIndex = board.lists.findIndex(l => l.listId === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return;
      }

      const reorderedLists = arrayMove(board.lists, oldIndex, newIndex);
      const movedList = reorderedLists[newIndex];
      const listBefore = reorderedLists[newIndex - 1];
      const listAfter = reorderedLists[newIndex + 1];
      
      const newPosition = calculatePosition(listBefore?.position, listAfter?.position);

      moveList({
        id: movedList.listId,
        updates: { position: newPosition, boardId: board.boardId },
        boardId: board.boardId,
      });
      return;
    }

    // Handle Card Dragging
    if (activeType === 'Card' && over) {
      const activeCard = active.data.current?.card as Card;
      if (!activeCard) return;

      const overId = over.id.toString();
      const overData = over.data.current;
      
      let targetListId: string;
      let newPosition: number;

      const allCards = board.lists.flatMap(l => l.cards || []);

      if (overData?.type === 'List') {
        // Card dropped on a list
        targetListId = overId;
        const targetList = board.lists.find(l => l.listId === targetListId);
        const cardsInList = [...(targetList?.cards ?? [])].sort((a, b) => a.position - b.position);
        const lastCard = cardsInList[cardsInList.length - 1];
        newPosition = calculatePosition(lastCard?.position);
      } else if (overData?.type === 'Card') {
        // Card dropped on another card
        const overCard = allCards.find(c => c.cardId === overId);
        if (!overCard) return;

        targetListId = overCard.listId;
        const cardsInTargetList = [...(board.lists.find(l => l.listId === targetListId)?.cards ?? [])].sort((a, b) => a.position - b.position);

        if (activeCard.listId === targetListId) {
          // Sorting in the same list
          const oldIndex = cardsInTargetList.findIndex(c => c.cardId === activeId);
          const newIndex = cardsInTargetList.findIndex(c => c.cardId === overId);
          if (oldIndex === newIndex) return;

          const reorderedCards = arrayMove(cardsInTargetList, oldIndex, newIndex);
          const finalNewIndex = reorderedCards.findIndex(c => c.cardId === activeId);

          const cardBefore = reorderedCards[finalNewIndex - 1];
          const cardAfter = reorderedCards[finalNewIndex + 1];
          newPosition = calculatePosition(cardBefore?.position, cardAfter?.position);
        } else {
          // Moving to a new list
          const overCardIndex = cardsInTargetList.findIndex(c => c.cardId === overId);
          const cardBefore = cardsInTargetList[overCardIndex - 1];
          newPosition = calculatePosition(cardBefore?.position, overCard.position);
        }
      } else {
        return; // Invalid drop target
      }

      if (activeCard.listId === targetListId && activeCard.position === newPosition) {
        return; // No change
      }

      moveCard({
        id: activeId,
        updates: {
          listId: targetListId,
          position: newPosition,
        },
        boardId: board.boardId,
      });
    }
  }, [board, moveCard, moveList]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading board</h2>
          <p className="mb-4">Board not found or failed to load.</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <KanbanBoard
        board={board}
        onUpdateBoard={async (boardId, updates) => {
          try {
            await updateBoard({ id: boardId, updates }).unwrap();
          } catch (error) {
            console.error('Failed to update board:', error);
          }
        }}
        onCreateList={async (boardId, listData) => {
          try {
            await createList({ boardId, listData }).unwrap();
          } catch (error) {
            console.error('Failed to create list:', error);
          }
        }}
        onUpdateList={async (listId, updates) => {
          try {
            await updateList({ id: listId, updates }).unwrap();
          } catch (error) {
            console.error('Failed to update list:', error);
          }
        }}
        onDeleteList={async (listId) => {
          try {
            await deleteList({ id: listId, boardId: board.boardId }).unwrap();
          } catch (error) {
            console.error('Failed to delete list:', error);
          }
        }}
        onCreateCard={async (listId, cardData) => {
          try {
            await createCard({ listId, cardData, boardId: board.boardId }).unwrap();
          } catch (error) {
            console.error('Failed to create card:', error);
          }
        }}
        onUpdateCard={async (cardId, updates) => {
          try {
            await updateCard({ id: cardId, updates, boardId: board.boardId }).unwrap();
          } catch (error) {
            console.error('Failed to update card:', error);
          }
        }}
        onDeleteCard={async (cardId) => {
          try {
            await deleteCard({ id: cardId, boardId: board.boardId }).unwrap();
          } catch (error) {
            console.error('Failed to delete card:', error);
          }
        }}
      />
    </DndContext>
  );
}
