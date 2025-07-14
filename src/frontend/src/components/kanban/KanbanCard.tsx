import React, { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Card as CardType } from '@/shared/types';

interface KanbanCardProps {
  card: CardType;
  onUpdate?: (updates: Partial<CardType>) => void;
  onDelete?: () => void;
  className?: string;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, onUpdate, onDelete, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.cardId, data: { type: 'Card', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const handleSaveTitle = useCallback(() => {
    if (editTitle.trim() && editTitle !== card.title) {
      onUpdate?.({ title: editTitle.trim() });
    }
    setIsEditing(false);
  }, [editTitle, card.title, onUpdate]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(card.title);
      setIsEditing(false);
    }
  }, [handleSaveTitle, card.title]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent entering edit mode when dragging
      if (isDragging) {
        e.preventDefault();
        return;
      }
      if (!isEditing) {
        setIsEditing(true);
      }
    },
    [isEditing, isDragging]
  );

  const formatDueDate = (dueDate: Date | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const isOverdue = date < now;
    const isToday = date.toDateString() === now.toDateString();
    
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return {
      text: formatted,
      isOverdue,
      isToday
    };
  };

  const dueDateInfo = formatDueDate(card.dueDate);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`hover:shadow-sm transition-shadow ${className} ${
          isDragging ? 'shadow-lg' : ''
        }`}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyPress}
              className="text-sm font-medium bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-500 focus:rounded px-1 -mx-1"
              autoFocus
              onClick={(e) => e.stopPropagation()} // Prevent card click from firing
            />
          ) : (
            <CardTitle className="text-sm font-medium leading-5">
              {card.title}
            </CardTitle>
          )}
        </CardHeader>

        {(card.description || card.labels?.length || dueDateInfo) && (
          <CardContent className="pt-0">
            {card.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                {card.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1 text-xs">
              {/* Due date */}
              {dueDateInfo && (
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    dueDateInfo.isOverdue
                      ? 'bg-red-100 text-red-700'
                      : dueDateInfo.isToday
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {dueDateInfo.text}
                </span>
              )}

              {/* Labels */}
              {card.labels?.map((label) => (
                <span
                  key={label.id}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: label.color + '20',
                    color: label.color,
                  }}
                >
                  {label.name}
                </span>
              ))}

              {/* Card actions */}
              {onDelete && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                >
                  ×
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
