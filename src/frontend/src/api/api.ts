import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import { 
  BoardWithDetails, 
  CreateBoardDto, 
  UpdateBoardDto, 
  List,
  CreateListDto,
  UpdateListDto,
  MoveListDto,
  Card,
  CreateCardDto,
  UpdateCardDto,
  MoveCardDto,
  ApiResponse 
} from '@/shared/types';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.user?.idToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Board', 'List', 'Card'],
  endpoints: (builder) => ({
    // ===== BOARDS =====
    getBoards: builder.query<BoardWithDetails[], void>({
      query: () => '/boards',
      transformResponse: (response: ApiResponse<BoardWithDetails[]>) => response.data || [],
      providesTags: ['Board'],
    }),
    getBoardById: builder.query<BoardWithDetails, string>({
      query: (id) => `/boards/${id}`,
      transformResponse: (response: ApiResponse<BoardWithDetails>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'Board', id }],
    }),
    createBoard: builder.mutation<BoardWithDetails, CreateBoardDto>({
      query: (board) => ({
        url: '/boards',
        method: 'POST',
        body: board,
      }),
      transformResponse: (response: ApiResponse<BoardWithDetails>) => response.data!,
      invalidatesTags: ['Board'],
    }),
    updateBoard: builder.mutation<BoardWithDetails, { id: string; updates: UpdateBoardDto }>({
      query: ({ id, updates }) => ({
        url: `/boards/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: ApiResponse<BoardWithDetails>) => response.data!,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Board', id }, 'Board'],
    }),
    deleteBoard: builder.mutation<void, string>({
      query: (id) => ({
        url: `/boards/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Board'],
    }),

    // ===== LISTS =====
    getListById: builder.query<List, string>({
      query: (id) => `/lists/${id}`,
      transformResponse: (response: ApiResponse<List>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'List', id }],
    }),
    createList: builder.mutation<List, { boardId: string; listData: CreateListDto }>({
      query: ({ boardId, listData }) => ({
        url: `/boards/${boardId}/lists`,
        method: 'POST',
        body: listData,
      }),
      transformResponse: (response: ApiResponse<List>) => response.data!,
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        'Board',
      ],
    }),
    updateList: builder.mutation<List, { id: string; updates: UpdateListDto }>({
      query: ({ id, updates }) => ({
        url: `/lists/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: ApiResponse<List>) => response.data!,
      invalidatesTags: (result, _error, { id }) => [
        { type: 'List', id },
        { type: 'Board', id: result?.boardId },
        'Board',
      ],
    }),
    deleteList: builder.mutation<void, { id: string; boardId: string }>({
      query: ({ id }) => ({
        url: `/lists/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        'Board',
      ],
    }),
    moveList: builder.mutation<List, { id: string; updates: MoveListDto, boardId: string }>({
      query: ({ id, updates }) => ({
        url: `/lists/${id}/move`,
        method: 'PUT',
        body: updates,
      }),
      async onQueryStarted({ id, updates, boardId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getBoardById', boardId, (draft) => {
            const list = draft.lists.find(l => l.id === id);
            if (list) {
              list.position = updates.position;
              draft.lists.sort((a, b) => a.position - b.position);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),

    // ===== CARDS =====
    getCardById: builder.query<Card, string>({
      query: (id) => `/cards/${id}`,
      transformResponse: (response: ApiResponse<Card>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'Card', id }],
    }),
    createCard: builder.mutation<Card, { listId: string; cardData: CreateCardDto; boardId: string }>({
      query: ({ listId, cardData }) => ({
        url: `/lists/${listId}/cards`,
        method: 'POST',
        body: cardData,
      }),
      transformResponse: (response: ApiResponse<Card>) => response.data!,
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    updateCard: builder.mutation<Card, { id: string; updates: UpdateCardDto; boardId: string }>({
      query: ({ id, updates }) => ({
        url: `/cards/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: ApiResponse<Card>) => response.data!,
      invalidatesTags: (_result, _error, { id, boardId }) => [
        { type: 'Card', id },
        { type: 'Board', id: boardId },
      ],
    }),
    deleteCard: builder.mutation<void, { id: string; boardId: string }>({
        query: ({ id }) => ({
            url: `/cards/${id}`,
            method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    moveCard: builder.mutation<Card, { id: string; updates: MoveCardDto, boardId: string }>({
      query: ({ id, updates }) => ({
        url: `/cards/${id}/move`,
        method: 'PUT',
        body: updates,
      }),
      async onQueryStarted({ id, updates, boardId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getBoardById', boardId, (draft) => {
            let cardToMove: (Card & { listId: string }) | undefined;
            let sourceList: (List & { cards: Card[] }) | undefined;

            // Find card and its source list
            for (const list of draft.lists) {
              const card = list.cards.find(c => c.id === id);
              if (card) {
                cardToMove = { ...card, listId: list.id };
                sourceList = list;
                break;
              }
            }

            if (cardToMove && sourceList) {
              // Remove from old list
              sourceList.cards = sourceList.cards.filter(c => c.id !== id);
              
              // Add to new list
              const destinationList = draft.lists.find(l => l.id === updates.listId);
              if (destinationList) {
                const movedCard = { ...cardToMove, listId: updates.listId, position: updates.position };
                destinationList.cards.push(movedCard);
                destinationList.cards.sort((a, b) => a.position - b.position);
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
  }),
});

export const {
  // Board hooks
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  
  // List hooks
  useGetListByIdQuery,
  useCreateListMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useMoveListMutation,
  
  // Card hooks
  useGetCardByIdQuery,
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useMoveCardMutation,
} = api;
