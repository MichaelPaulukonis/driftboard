import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { CreateCardDto } from '@/shared/types';

interface CreateCardFormProps {
  onSubmit: (data: CreateCardDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CreateCardForm: React.FC<CreateCardFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [title, setTitle] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    onSubmit({
      title: title.trim()
    });
  }, [title, onSubmit]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  const isValid = title.trim().length > 0;

  return (
    <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter a title for this card..."
          disabled={isLoading}
          autoFocus
          className="w-full p-2 text-sm border-none outline-none resize-none min-h-[60px] focus:ring-2 focus:ring-blue-500 rounded"
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            size="sm"
          >
            {isLoading ? 'Adding...' : 'Add Card'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
