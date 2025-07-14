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
      async onQueryStarted({ id, updates, boardId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getBoardById', boardId, (draft) => {
            const { position } = updates;
            const listIndex = draft.lists.findIndex((l) => l.listId === id);
            if (listIndex > -1) {
              const [movedList] = draft.lists.splice(listIndex, 1);
              if (movedList) {
                movedList.position = position;
                draft.lists.push(movedList);
                draft.lists.sort((a, b) => a.position - b.position);
              }
            }
          })
        );
        try {
          const { data: movedList } = await queryFulfilled;
          // After the API call is successful, patch the data again with the final
          // state from the server (which includes the new version number).
          dispatch(
            api.util.updateQueryData('getBoardById', boardId, (draft) => {
              const listIndex = draft.lists.findIndex(l => l.listId === movedList.listId);
              if (listIndex !== -1) {
                // Ensure the list and its cards conform to the cache's stricter type
                const listForCache = {
                  ...movedList,
                  cards: (movedList.cards ?? []).map(card => ({
                    ...card,
                    labels: card.labels ?? [],
                  })),
                };
                draft.lists[listIndex] = listForCache;
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'List', id: result?.listId },
      ],
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
            const { listId: newListId, position } = updates;
            let cardToMove: Card | undefined;

            // Find the card and remove it from its original list
            for (const list of draft.lists) {
              const cardIndex = list.cards.findIndex((c) => c.cardId === id);
              if (cardIndex > -1) {
                [cardToMove] = list.cards.splice(cardIndex, 1);
                break;
              }
            }

            // Add the card to the new list and update its position
            if (cardToMove) {
              cardToMove.position = position;
              const targetList = draft.lists.find((l) => l.listId === newListId);
              if (targetList) {
                targetList.cards.push(cardToMove);
                targetList.cards.sort((a, b) => a.position - b.position);
              }
            }
          })
        );

        try {
          const { data: movedCard } = await queryFulfilled;
          // After the API call is successful, we patch the data again with the final
          // state from the server (which includes the new version number).
          dispatch(
            api.util.updateQueryData('getBoardById', boardId, (draft) => {
              const list = draft.lists.find(l => l.listId === movedCard.listId);
              if (list) {
                const cardIndex = list.cards.findIndex(c => c.cardId === movedCard.cardId);
                if (cardIndex !== -1) {
                  // Ensure the moved card has the expected shape, especially the 'labels' array.
                  const cardForCache = {
                    ...movedCard,
                    labels: movedCard.labels ?? [],
                  };
                  // Replace the optimistically moved card with the final version from the server
                  list.cards[cardIndex] = cardForCache;
                }
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
      // We can keep invalidatesTags as a fallback and to ensure related data is fresh,
      // though the optimistic update should handle the immediate UI change.
      invalidatesTags: (result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'Card', id: result?.cardId },
      ],
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
