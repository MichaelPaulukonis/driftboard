import { useParams } from 'react-router-dom';
import { 
  useGetBoardByIdQuery, 
  useUpdateBoardMutation,
  useCreateListMutation, 
  useUpdateListMutation, 
  useDeleteListMutation,
  useCreateCardMutation, 
  useUpdateCardMutation, 
  useDeleteCardMutation 
} from '../api/api';
import { Board } from '@/components/kanban/Board';

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: board, error, isLoading } = useGetBoardByIdQuery(id!);
  
  // RTK Query mutations
  const [updateBoard] = useUpdateBoardMutation();
  const [createList] = useCreateListMutation();
  const [updateList] = useUpdateListMutation();
  const [deleteList] = useDeleteListMutation();
  const [createCard] = useCreateCardMutation();
  const [updateCard] = useUpdateCardMutation();
  const [deleteCard] = useDeleteCardMutation();

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
      onUpdateBoard={async (boardId, updates) => {
        try {
          await updateBoard({ id: boardId, updates }).unwrap();
        } catch (error) {
          console.error('Failed to update board:', error);
        }
      }}
      onCreateList={async (boardId, listData) => {
        try {
          await createList({ boardId, listData }).unwrap();
        } catch (error) {
          console.error('Failed to create list:', error);
        }
      }}
      onUpdateList={async (listId, updates) => {
        try {
          await updateList({ id: listId, updates }).unwrap();
        } catch (error) {
          console.error('Failed to update list:', error);
        }
      }}
      onDeleteList={async (listId) => {
        try {
          await deleteList(listId).unwrap();
        } catch (error) {
          console.error('Failed to delete list:', error);
        }
      }}
      onCreateCard={async (listId, cardData) => {
        try {
          await createCard({ listId, cardData }).unwrap();
        } catch (error) {
          console.error('Failed to create card:', error);
        }
      }}
      onUpdateCard={async (cardId, updates) => {
        try {
          await updateCard({ id: cardId, updates }).unwrap();
        } catch (error) {
          console.error('Failed to update card:', error);
        }
      }}
      onDeleteCard={async (cardId) => {
        try {
          await deleteCard(cardId).unwrap();
        } catch (error) {
          console.error('Failed to delete card:', error);
        }
      }}
    />
  );
}
