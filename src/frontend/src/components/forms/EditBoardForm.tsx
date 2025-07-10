import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { UpdateBoardDto } from '@/shared/types';

interface EditBoardFormProps {
  initialName: string;
  initialDescription?: string;
  onSubmit: (data: UpdateBoardDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EditBoardForm: React.FC<EditBoardFormProps> = ({
  initialName,
  initialDescription = '',
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined
    });
  }, [name, description, onSubmit]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  const isValid = name.trim().length > 0;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-lg max-w-md">
      <h3 className="text-lg font-semibold mb-4">Edit Board</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="board-name" className="block text-sm font-medium text-gray-700 mb-1">
            Board Name
          </label>
          <input
            id="board-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter board name"
            autoFocus
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="board-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="board-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Enter board description (optional)"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
};
