import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { List } from './List';
import { CreateListForm } from '@/components/forms/CreateListForm';
import { EditBoardForm } from '@/components/forms/EditBoardForm';
import type { BoardWithDetails, UpdateBoardDto } from '@/shared/types';

interface BoardProps {
  board: BoardWithDetails;
  onUpdateBoard?: (boardId: string, updates: any) => void;
  onCreateList?: (boardId: string, listData: any) => void;
  onUpdateList?: (listId: string, updates: any) => void;
  onDeleteList?: (listId: string) => void;
  onCreateCard?: (listId: string, cardData: any) => void;
  onUpdateCard?: (cardId: string, updates: any) => void;
  onDeleteCard?: (cardId: string) => void;
  className?: string;
}

export const Board: React.FC<BoardProps> = ({
  board,
  onUpdateBoard,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  className
}) => {
  const [showCreateList, setShowCreateList] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editName, setEditName] = useState(board.name);
  const [editDescription, setEditDescription] = useState(board.description || '');

  const handleCreateList = useCallback((listData: any) => {
    onCreateList?.(board.id, listData);
    setShowCreateList(false);
  }, [board.id, onCreateList]);

  const handleUpdateBoard = useCallback((updates: UpdateBoardDto) => {
    onUpdateBoard?.(board.id, updates);
    setShowEditForm(false);
  }, [board.id, onUpdateBoard]);

  const handleSaveName = useCallback(() => {
    if (editName.trim() && editName !== board.name) {
      onUpdateBoard?.(board.id, { name: editName.trim() });
    }
    setIsEditingName(false);
  }, [editName, board.name, board.id, onUpdateBoard]);

  const handleSaveDescription = useCallback(() => {
    const newDescription = editDescription.trim() || undefined;
    if (newDescription !== board.description) {
      onUpdateBoard?.(board.id, { description: newDescription });
    }
    setIsEditingDescription(false);
  }, [editDescription, board.description, board.id, onUpdateBoard]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, field: 'name' | 'description') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (field === 'name') {
        handleSaveName();
      } else {
        handleSaveDescription();
      }
    } else if (e.key === 'Escape') {
      if (field === 'name') {
        setEditName(board.name);
        setIsEditingName(false);
      } else {
        setEditDescription(board.description || '');
        setIsEditingDescription(false);
      }
    }
  }, [handleSaveName, handleSaveDescription, board.name, board.description]);

  // Sort lists by position (create a copy first since RTK Query data is immutable)
  const sortedLists = board.lists ? [...board.lists].sort((a, b) => a.position - b.position) : [];

  return (
    <div className={`h-full ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <Link 
              to="/boards" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Boards
            </Link>
          </div>
          
          {/* Board Name - editable on double-click */}
          {isEditingName ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => handleKeyPress(e, 'name')}
              className="text-3xl font-bold text-gray-800 bg-transparent border-2 border-blue-500 rounded px-2 py-1 focus:outline-none"
              autoFocus
            />
          ) : (
            <h1 
              className="text-3xl font-bold text-gray-800 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1"
              onDoubleClick={() => {
                setEditName(board.name);
                setIsEditingName(true);
              }}
              title="Double-click to edit"
            >
              {board.name}
            </h1>
          )}
          
          {/* Board Description - editable on double-click */}
          {isEditingDescription ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onBlur={handleSaveDescription}
              onKeyDown={(e) => handleKeyPress(e, 'description')}
              className="text-gray-600 mt-2 bg-transparent border-2 border-blue-500 rounded px-2 py-1 focus:outline-none resize-none w-full"
              placeholder="Enter board description (optional)"
              rows={2}
              autoFocus
            />
          ) : (
            <p 
              className="text-gray-600 mt-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 min-h-[1.5rem]"
              onDoubleClick={() => {
                setEditDescription(board.description || '');
                setIsEditingDescription(true);
              }}
              title="Double-click to edit"
            >
              {board.description || 'Add a description...'}
            </p>
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
            onClick={() => setShowEditForm(true)}
            variant="outline"
          >
            Edit Board
          </Button>
        </div>
      </div>

      {/* Edit Board Modal/Form */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <EditBoardForm
            initialName={board.name}
            initialDescription={board.description || undefined}
            onSubmit={handleUpdateBoard}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      )}

      {/* Board Content */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {/* Existing Lists */}
        {sortedLists.map((list) => (
          <List
            key={list.id}
            list={list}
            onUpdate={(updates: any) => onUpdateList?.(list.id, updates)}
            onDelete={() => onDeleteList?.(list.id)}
            onCreateCard={(cardData: any) => onCreateCard?.(list.id, cardData)}
            onUpdateCard={onUpdateCard}
            onDeleteCard={onDeleteCard}
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
