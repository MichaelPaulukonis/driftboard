import { useState, useCallback } from 'react';
import { useGetBoardsQuery, useCreateBoardMutation, useDeleteBoardMutation } from '../api/api';
import { BoardCard } from '@/components/kanban/BoardCard';
import { BoardForm } from '@/components/forms/BoardForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CreateBoardDto } from '@/shared/types';

export function BoardsPage() {
  const { data: boards, error, isLoading } = useGetBoardsQuery();
  const [createBoard, { isLoading: isCreating }] = useCreateBoardMutation();
  const [deleteBoard] = useDeleteBoardMutation();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateBoard = useCallback(async (boardData: CreateBoardDto) => {
    try {
      await createBoard(boardData).unwrap();
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  }, [createBoard]);

  const handleDeleteBoard = useCallback(async (boardId: string) => {
    if (window.confirm('Are you sure you want to delete this board?')) {
      try {
        await deleteBoard(boardId).unwrap();
      } catch (error) {
        console.error('Failed to delete board:', error);
      }
    }
  }, [deleteBoard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error loading boards</h2>
          <p>Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Boards</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          Create Board
        </Button>
      </div>

      {boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onDelete={handleDeleteBoard}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No boards yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first board.</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create Your First Board
          </Button>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <BoardForm
            onSubmit={handleCreateBoard}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
