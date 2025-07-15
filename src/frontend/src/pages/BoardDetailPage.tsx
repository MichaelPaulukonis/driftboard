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
      const activeList = active.data.current?.list as List;
      if (!activeList || activeList.listId === over.data.current?.list?.listId) {
        setActiveItem(null);
        return;
      }

      const sortedLists = [...board.lists].sort((a, b) => a.position - b.position);
      const oldIndex = sortedLists.findIndex(l => l.listId === activeList.listId);
      const newIndex = sortedLists.findIndex(l => l.listId === over.data.current?.list?.listId);

      if (oldIndex === -1 || newIndex === -1) return;
      
      const itemBefore = newIndex === 0 ? undefined : sortedLists[newIndex - 1];
      const itemAfter = sortedLists[newIndex];

      const newPosition = oldIndex < newIndex 
        ? calculatePosition(itemAfter?.position, sortedLists[newIndex + 1]?.position)
        : calculatePosition(itemBefore?.position, itemAfter?.position);

      moveList({
        id: activeList.listId,
        updates: { position: newPosition, boardId: board.boardId },
        boardId: board.boardId,
      });
      setActiveItem(null);
      return;
    }

    // Handle Card Dragging
    if (activeType === 'Card' && over) {
      const activeCard = active.data.current?.card as Card;
      if (!activeCard) {
        setActiveItem(null);
        return;
      }

      const overData = over.data.current;
      let targetListId: string; // This must be the persistent listId
      let newPosition: number;

      // Determine the target list and new position based on the drop target
      if (overData?.type === 'List') {
        // Case 1: Dropped on a List container (likely an empty list)
        const overList = board.lists.find(l => l.listId === over.id);
        if (!overList) return;
        
        targetListId = overList.listId;
        const cardsInList = (overList.cards ?? []).sort((a, b) => a.position - b.position);
        newPosition = calculatePosition(cardsInList[cardsInList.length - 1]?.position);

      } else if (overData?.type === 'Card') {
        // Case 2: Dropped on another Card
        const overCard = overData.card as Card;
        
        // Find the list that the 'overCard' belongs to
        const targetList = board.lists.find(l => l.id === overCard.listId);
        if (!targetList) return;
        targetListId = targetList.listId;

        const cardsInTargetList = [...targetList.cards].sort((a, b) => a.position - b.position);
        const overCardIndex = cardsInTargetList.findIndex(c => c.cardId === over.id);

        if (activeCard.listId === overCard.listId) {
          // Reordering within the same list
          const activeCardIndex = cardsInTargetList.findIndex(c => c.cardId === activeCard.cardId);
          
          if (activeCardIndex === overCardIndex) return; // Dropped on itself

          const itemBefore = activeCardIndex < overCardIndex 
            ? cardsInTargetList[overCardIndex] 
            : cardsInTargetList[overCardIndex - 1];
          
          const itemAfter = activeCardIndex < overCardIndex 
            ? cardsInTargetList[overCardIndex + 1]
            : cardsInTargetList[overCardIndex];

          newPosition = calculatePosition(itemBefore?.position, itemAfter?.position);
        } else {
          // Moving to a new list
          const itemBefore = cardsInTargetList[overCardIndex - 1];
          const itemAfter = cardsInTargetList[overCardIndex];
          newPosition = calculatePosition(itemBefore?.position, itemAfter?.position);
        }
      } else {
        return; // Invalid drop target
      }

      // Don't dispatch if nothing changed
      if (activeCard.listId === targetListId && activeCard.position === newPosition) {
        setActiveItem(null);
        return;
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
