import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  BoardWithDetails, 
  CreateBoardDto, 
  UpdateBoardDto, 
  List,
  CreateListDto,
  UpdateListDto,
  Card,
  CreateCardDto,
  UpdateCardDto,
  ApiResponse 
} from '@/shared/types';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // In development, we don't need auth headers
      // TODO: Add Firebase auth token in production
      if (process.env.NODE_ENV === 'production') {
        const token = localStorage.getItem('firebase-auth-token');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
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
    deleteList: builder.mutation<void, string>({
      query: (id) => ({
        url: `/lists/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Board'], // Invalidate all boards since we don't know which board
    }),

    // ===== CARDS =====
    getCardById: builder.query<Card, string>({
      query: (id) => `/cards/${id}`,
      transformResponse: (response: ApiResponse<Card>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'Card', id }],
    }),
    createCard: builder.mutation<Card, { listId: string; cardData: CreateCardDto }>({
      query: ({ listId, cardData }) => ({
        url: `/lists/${listId}/cards`,
        method: 'POST',
        body: cardData,
      }),
      transformResponse: (response: ApiResponse<Card>) => response.data!,
      invalidatesTags: (_result, _error, { listId }) => [
        { type: 'List', id: listId },
        'Board', // Invalidate all boards to refresh cards
      ],
    }),
    updateCard: builder.mutation<Card, { id: string; updates: UpdateCardDto }>({
      query: ({ id, updates }) => ({
        url: `/cards/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: ApiResponse<Card>) => response.data!,
      invalidatesTags: (result, _error, { id }) => [
        { type: 'Card', id },
        { type: 'List', id: result?.listId },
        'Board', // Invalidate all boards to refresh cards
      ],
    }),
    moveCard: builder.mutation<Card, { id: string; targetListId: string; position: number }>({
      query: ({ id, targetListId, position }) => ({
        url: `/cards/${id}/move`,
        method: 'PUT',
        body: { listId: targetListId, position },
      }),
      transformResponse: (response: ApiResponse<Card>) => response.data!,
      invalidatesTags: (result, _error, { id, targetListId }) => [
        { type: 'Card', id },
        { type: 'List', id: targetListId },
        { type: 'List', id: result?.listId }, // Original list if moved
        'Board', // Invalidate all boards to refresh after move
      ],
    }),
    deleteCard: builder.mutation<void, string>({
      query: (id) => ({
        url: `/cards/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Board'], // Invalidate all boards to refresh cards
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
  
  // Card hooks
  useGetCardByIdQuery,
  useCreateCardMutation,
  useUpdateCardMutation,
  useMoveCardMutation,
  useDeleteCardMutation,
} = api;
