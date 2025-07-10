import React from 'react';
import { useParams } from 'react-router-dom';
import { useGetBoardByIdQuery } from '../api/boardsApi';
import { Board } from '@/components/kanban/Board';

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: board, error, isLoading } = useGetBoardByIdQuery(id!);

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
    <Board
      board={board}
      onUpdateBoard={(boardId, updates) => {
        console.log('Update board:', boardId, updates);
        // TODO: Implement board update
      }}
      onCreateList={(boardId, listData) => {
        console.log('Create list:', boardId, listData);
        // TODO: Implement list creation
      }}
      onUpdateList={(listId, updates) => {
        console.log('Update list:', listId, updates);
        // TODO: Implement list update
      }}
      onDeleteList={(listId) => {
        console.log('Delete list:', listId);
        // TODO: Implement list deletion
      }}
    />
  );
}
