import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateListDto } from '@/shared/types';

interface CreateListFormProps {
  onSubmit: (data: CreateListDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CreateListForm: React.FC<CreateListFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [name, setName] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onSubmit({
      name: name.trim()
    });
  }, [name, onSubmit]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  const isValid = name.trim().length > 0;

  return (
    <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter list title..."
          disabled={isLoading}
          autoFocus
          className="bg-white"
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            size="sm"
          >
            {isLoading ? 'Adding...' : 'Add List'}
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
