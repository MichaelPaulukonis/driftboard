import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BoardWithDetails } from '@/shared/types';

interface BoardCardProps {
  board: BoardWithDetails;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const BoardCard: React.FC<BoardCardProps> = ({ 
  board, 
  onEdit, 
  onDelete, 
  className 
}) => {
  const navigate = useNavigate();

  const handleOpen = useCallback(() => {
    navigate(`/boards/${board.boardId}`);
  }, [board.boardId, navigate]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(board.boardId);
  }, [board.boardId, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(board.boardId);
  }, [board.boardId, onDelete]);

  const listsCount = board.lists?.length || 0;
  const cardsCount = board.lists?.reduce((total, list) => total + (list.cards?.length || 0), 0) || 0;

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={handleOpen}
    >
      <CardHeader>
        <CardTitle className="text-xl">{board.name}</CardTitle>
        {board.description && (
          <CardDescription>{board.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <span>{listsCount} lists</span>
          <span>{cardsCount} cards</span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleOpen}
            className="flex-1"
            size="sm"
          >
            Open Board
          </Button>
          {onEdit && (
            <Button 
              onClick={handleEdit}
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              onClick={handleDelete}
              variant="destructive"
              size="sm"
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
