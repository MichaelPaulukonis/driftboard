import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KanbanCard } from './KanbanCard';
import { CreateCardForm } from '@/components/forms/CreateCardForm';
import type { List as ListType, Card as CardType } from '@/shared/types';

interface ListProps {
  list: ListType & { cards?: CardType[] };
  onUpdate?: (updates: Partial<ListType>) => void;
  onDelete?: () => void;
  onCreateCard?: (cardData: any) => void;
  onUpdateCard?: (cardId: string, updates: any) => void;
  onDeleteCard?: (cardId: string) => void;
  className?: string;
}

export const List: React.FC<ListProps> = ({
  list,
  onUpdate,
  onDelete,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  className
}) => {
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(list.name);

  const handleCreateCard = useCallback((cardData: any) => {
    onCreateCard?.(cardData);
    setShowCreateCard(false);
  }, [onCreateCard]);

  const handleSaveName = useCallback(() => {
    if (editName.trim() && editName !== list.name) {
      onUpdate?.({ name: editName.trim() });
    }
    setIsEditing(false);
  }, [editName, list.name, onUpdate]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditName(list.name);
      setIsEditing(false);
    }
  }, [handleSaveName, list.name]);

  // Sort cards by position (create a copy first since RTK Query data is immutable)
  const sortedCards = (list.cards ? [...list.cards] : []).sort((a: CardType, b: CardType) => a.position - b.position);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyPress}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-500 focus:rounded px-1"
            autoFocus
          />
        ) : (
          <CardTitle 
            className="text-lg cursor-pointer hover:bg-gray-50 rounded px-1 py-1"
            onClick={() => setIsEditing(true)}
          >
            {list.name}
          </CardTitle>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {sortedCards.length} cards
          </span>
          {onDelete && (
            <Button
              onClick={onDelete}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Cards */}
        {sortedCards.map((card: CardType) => (
          <KanbanCard
            key={card.id}
            card={card}
            onUpdate={(updates: Partial<CardType>) => onUpdateCard?.(card.id, updates)}
            onDelete={() => onDeleteCard?.(card.id)}
          />
        ))}

        {/* Create Card Form */}
        {showCreateCard && (
          <CreateCardForm
            onSubmit={handleCreateCard}
            onCancel={() => setShowCreateCard(false)}
          />
        )}

        {/* Add Card Button */}
        {!showCreateCard && (
          <Button
            onClick={() => setShowCreateCard(true)}
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-800"
          >
            + Add a card
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
