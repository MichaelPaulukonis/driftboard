import { useParams } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
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
import { Card, List } from '@/shared/types';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import { List as KanbanList } from '@/components/kanban/List';

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
  const [activeItem, setActiveItem] = useState<Card | List | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag needed to start
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Card') {
      setActiveItem(active.data.current.card);
    }
    if (active.data.current?.type === 'List') {
      setActiveItem(active.data.current.list);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !board) {
      setActiveItem(null);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    const activeType = active.data.current?.type;
    
    // Handle List Reordering
    if (activeType === 'List' && over) {
      if (activeId === overId) return;

      const sortedLists = [...board.lists].sort((a, b) => a.position - b.position);
      const oldIndex = sortedLists.findIndex(l => l.id === activeId);
      const newIndex = sortedLists.findIndex(l => l.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;
      
      const movedList = sortedLists[oldIndex];
      const itemBefore = newIndex === 0 ? undefined : sortedLists[newIndex - 1];
      const itemAfter = sortedLists[newIndex];

      // Adjust if moving downwards
      const newPosition = oldIndex < newIndex 
        ? calculatePosition(itemAfter?.position, sortedLists[newIndex + 1]?.position)
        : calculatePosition(itemBefore?.position, itemAfter?.position);

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

      const overData = over.data.current;
      
      let targetListId: string;
      let newPosition: number;

      const allCards = board.lists.flatMap(l => l.cards || []);

      if (overData?.type === 'List') {
        // Card dropped on an empty list
        const overList = board.lists.find(l => l.id === over.id);
        if (!overList) return;
        targetListId = overList.listId; // Use the persistent listId

        const cardsInList = [...(overList.cards ?? [])].sort((a, b) => a.position - b.position);
        const lastCard = cardsInList[cardsInList.length - 1];
        newPosition = calculatePosition(lastCard?.position);
      } else if (overData?.type === 'Card') {
        // Card dropped on another card
        const overCard = allCards.find(c => c.id === over.id);
        if (!overCard) return;

        targetListId = overCard.listId; // This is the persistent listId from the card's data
        const cardsInTargetList = board.lists.find(l => l.listId === targetListId)?.cards ?? [];
        const sortedCardsInTargetList = [...cardsInTargetList].sort((a, b) => a.position - b.position);

        const oldIndex = sortedCardsInTargetList.findIndex(c => c.id === activeId);
        const newIndex = sortedCardsInTargetList.findIndex(c => c.id === over.id);

        if (activeCard.listId === targetListId) {
          // Sorting in the same list
          const itemBefore = newIndex === 0 ? undefined : sortedCardsInTargetList[newIndex - 1];
          const itemAfter = sortedCardsInTargetList[newIndex];
          newPosition = oldIndex < newIndex
            ? calculatePosition(itemAfter?.position, sortedCardsInTargetList[newIndex + 1]?.position)
            : calculatePosition(itemBefore?.position, itemAfter?.position);
        } else {
          // Moving to a new list
          const itemBefore = newIndex === 0 ? undefined : sortedCardsInTargetList[newIndex - 1];
          const itemAfter = sortedCardsInTargetList[newIndex];
          newPosition = calculatePosition(itemBefore?.position, itemAfter?.position);
        }
      } else {
        return; // Invalid drop target
      }

      if (activeCard.listId === targetListId && activeCard.position === newPosition) {
        return; // No change
      }

      moveCard({
        id: activeCard.cardId,
        updates: {
          listId: targetListId,
          position: newPosition,
        },
        boardId: board.boardId,
      });
    }
    setActiveItem(null);
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
      onDragStart={handleDragStart}
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
      <DragOverlay>
        {activeItem && activeItem.hasOwnProperty('listId') ? (
          <KanbanCard card={activeItem as Card} />
        ) : null}
        {activeItem && activeItem.hasOwnProperty('boardId') ? (
          <KanbanList list={activeItem as List} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
