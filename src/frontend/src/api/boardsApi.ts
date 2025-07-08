import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BoardWithDetails, CreateBoardDto, UpdateBoardDto, ApiResponse } from '@/shared/types';

export const boardsApi = createApi({
  reducerPath: 'boardsApi',
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
  tagTypes: ['Board'],
  endpoints: (builder) => ({
    getBoards: builder.query<BoardWithDetails[], void>({
      query: () => '/boards',
      transformResponse: (response: ApiResponse<BoardWithDetails[]>) => response.data || [],
      providesTags: ['Board'],
    }),
    getBoardById: builder.query<BoardWithDetails, string>({
      query: (id) => `/boards/${id}`,
      transformResponse: (response: ApiResponse<BoardWithDetails>) => response.data!,
      providesTags: (result, error, id) => [{ type: 'Board', id }],
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
      invalidatesTags: (result, error, { id }) => [{ type: 'Board', id }, 'Board'],
    }),
    deleteBoard: builder.mutation<void, string>({
      query: (id) => ({
        url: `/boards/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Board'],
    }),
  }),
});

export const {
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
} = boardsApi;
