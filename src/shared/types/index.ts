/**
 * Shared type definitions for DriftBoard
 * Used by both frontend and backend
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lists?: List[];
}

export interface List {
  id: string;
  name: string;
  boardId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  cards?: Card[];
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  listId: string;
  position: number;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  labels?: Label[];
  activities?: Activity[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
  cardId: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  content: string | null;
  cardId: string;
  userId: string;
  createdAt: Date;
}

export type ActivityType = 'comment' | 'moved' | 'edited' | 'created' | 'archived' | 'restored';

// DTOs (Data Transfer Objects) for API requests/responses
export interface CreateBoardDto {
  name: string;
  description?: string;
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
  position?: number;
}

export interface CreateListDto {
  name: string;
  position?: number;
}

export interface UpdateListDto {
  name?: string;
  position?: number;
}

export interface MoveListDto {
  position: number;
  boardId: string;
}

export interface CreateCardDto {
  title: string;
  description?: string;
  position?: number;
  dueDate?: Date;
}

export interface UpdateCardDto {
  title?: string;
  description?: string;
  dueDate?: Date;
}

export interface MoveCardDto {
  listId: string;
  position: number;
}

export interface CreateActivityDto {
  type: ActivityType;
  content?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Board with full data (including lists and cards)
export interface BoardWithDetails extends Board {
  lists: (List & {
    cards: (Card & {
      labels: Label[];
    })[];
  })[];
}

// Firebase Auth user
export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

// Application state types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

export interface LoadingState {
  isLoading: boolean;
  error: AppError | null;
}
