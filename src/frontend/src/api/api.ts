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
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ boardId }) => ({ type: 'Board' as const, id: boardId })),
              { type: 'Board' as const, id: 'LIST' },
            ]
          : [{ type: 'Board' as const, id: 'LIST' }],
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
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Board', id }, { type: 'Board', id: 'LIST' }],
    }),
    deleteBoard: builder.mutation<void, string>({
      query: (id) => ({
        url: `/boards/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Board', id }, { type: 'Board', id: 'LIST' }],
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
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
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
      ],
    }),
    deleteList: builder.mutation<void, { id: string; boardId: string }>({
      query: ({ id }) => ({
        url: `/lists/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    moveList: builder.mutation<List, { id: string; updates: MoveListDto, boardId: string }>({
      query: ({ id, updates }) => ({
        url: `/lists/${id}/move`,
        method: 'PUT',
        body: updates,
      }),
      // After a move, invalidate the entire board to ensure all positions and new versions are fetched.
      // This is simpler and more reliable than a complex optimistic update for lists.
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
      // Invalidate the board to refetch all data. This is the simplest way to ensure
      // the UI is consistent after a card move, especially with the versioning system.
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
  }),
});

export const {
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  useGetListByIdQuery,
  useCreateListMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useMoveListMutation,
  useGetCardByIdQuery,
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useMoveCardMutation,
} = api;
