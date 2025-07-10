import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { List } from './List';
import { CreateListForm } from '@/components/forms/CreateListForm';
import type { BoardWithDetails } from '@/shared/types';

interface BoardProps {
  board: BoardWithDetails;
  onUpdateBoard?: (boardId: string, updates: any) => void;
  onCreateList?: (boardId: string, listData: any) => void;
  onUpdateList?: (listId: string, updates: any) => void;
  onDeleteList?: (listId: string) => void;
  className?: string;
}

export const Board: React.FC<BoardProps> = ({
  board,
  onUpdateBoard,
  onCreateList,
  onUpdateList,
  onDeleteList,
  className
}) => {
  const [showCreateList, setShowCreateList] = useState(false);

  const handleCreateList = useCallback((listData: any) => {
    onCreateList?.(board.id, listData);
    setShowCreateList(false);
  }, [board.id, onCreateList]);

  // Sort lists by position
  const sortedLists = board.lists?.sort((a, b) => a.position - b.position) || [];

  return (
    <div className={`h-full ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link 
              to="/boards" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Boards
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{board.name}</h1>
          {board.description && (
            <p className="text-gray-600 mt-2">{board.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateList(true)}
            variant="outline"
          >
            Add List
          </Button>
          <Button
            onClick={() => onUpdateBoard?.(board.id, {})}
            variant="outline"
          >
            Edit Board
          </Button>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {/* Existing Lists */}
        {sortedLists.map((list) => (
          <List
            key={list.id}
            list={list}
            onUpdate={(updates: any) => onUpdateList?.(list.id, updates)}
            onDelete={() => onDeleteList?.(list.id)}
            className="flex-shrink-0 w-80"
          />
        ))}

        {/* Create List Form */}
        {showCreateList && (
          <div className="flex-shrink-0 w-80">
            <CreateListForm
              onSubmit={handleCreateList}
              onCancel={() => setShowCreateList(false)}
            />
          </div>
        )}

        {/* Add List Button (when not showing form) */}
        {!showCreateList && (
          <div className="flex-shrink-0 w-80">
            <Button
              onClick={() => setShowCreateList(true)}
              variant="outline"
              className="w-full h-24 border-dashed border-2 text-gray-500 hover:text-gray-700 hover:border-gray-400"
            >
              + Add a list
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
