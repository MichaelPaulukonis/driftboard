# API Documentation

This document provides comprehensive documentation for the DriftBoard API endpoints, covering boards, lists, and cards management.

## Base URL

```
http://localhost:8000/api
```

## Authentication

Currently, authentication is bypassed in development and test environments. In production, all endpoints (except health) require Firebase JWT authentication.

## Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Health Endpoint

### GET /health

Returns the API health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-07-09T14:53:20.123Z",
    "uptime": 123.456,
    "version": "1.0.0",
    "environment": "development"
  },
  "message": "DriftBoard API is healthy"
}
```

## Boards API

### GET /boards

Retrieve all boards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "board_123",
      "name": "My Project Board",
      "description": "Project planning and task management",
      "createdAt": "2025-07-09T10:00:00.000Z",
      "updatedAt": "2025-07-09T10:00:00.000Z",
      "archivedAt": null
    }
  ]
}
```

### GET /boards/:id

Retrieve a specific board with its lists and cards.

**Parameters:**
- `id` (string): Board ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "board_123",
    "name": "My Project Board",
    "description": "Project planning and task management",
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z",
    "archivedAt": null,
    "lists": [
      {
        "id": "list_456",
        "name": "To Do",
        "position": 0,
        "boardId": "board_123",
        "cards": [
          {
            "id": "card_789",
            "title": "Task 1",
            "description": "Description of task 1",
            "position": 0,
            "listId": "list_456",
            "dueDate": null,
            "createdAt": "2025-07-09T10:00:00.000Z",
            "updatedAt": "2025-07-09T10:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

### POST /boards

Create a new board.

**Request Body:**
```json
{
  "name": "New Board",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "board_new",
    "name": "New Board",
    "description": "Optional description",
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z",
    "archivedAt": null
  },
  "message": "Board created successfully"
}
```

### PUT /boards/:id

Update a board.

**Parameters:**
- `id` (string): Board ID

**Request Body:**
```json
{
  "name": "Updated Board Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "board_123",
    "name": "Updated Board Name",
    "description": "Updated description",
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z",
    "archivedAt": null
  },
  "message": "Board updated successfully"
}
```

### DELETE /boards/:id

Delete a board.

**Parameters:**
- `id` (string): Board ID

**Response:**
```json
{
  "success": true,
  "message": "Board deleted successfully"
}
```

### POST /boards/:id/lists

Create a new list in a board.

**Parameters:**
- `id` (string): Board ID

**Request Body:**
```json
{
  "name": "New List",
  "position": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "list_new",
    "name": "New List",
    "position": 0,
    "boardId": "board_123",
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z",
    "cards": []
  },
  "message": "List created successfully"
}
```

## Lists API

### GET /lists/:id

Retrieve a specific list with its cards.

**Parameters:**
- `id` (string): List ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "list_456",
    "name": "To Do",
    "position": 0,
    "boardId": "board_123",
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z",
    "cards": [
      {
        "id": "card_789",
        "title": "Task 1",
        "description": "Description of task 1",
        "position": 0,
        "listId": "list_456",
        "dueDate": null,
        "createdAt": "2025-07-09T10:00:00.000Z",
        "updatedAt": "2025-07-09T10:00:00.000Z"
      }
    ]
  }
}
```

### PUT /lists/:id

Update a list.

**Parameters:**
- `id` (string): List ID

**Request Body:**
```json
{
  "name": "Updated List Name",
  "position": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "list_456",
    "name": "Updated List Name",
    "position": 1000,
    "boardId": "board_123",
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z",
    "cards": []
  },
  "message": "List updated successfully"
}
```

### DELETE /lists/:id

Delete a list and all its cards.

**Parameters:**
- `id` (string): List ID

**Response:**
```json
{
  "success": true,
  "message": "List deleted successfully"
}
```

### POST /lists/:id/cards

Create a new card in a list.

**Parameters:**
- `id` (string): List ID

**Request Body:**
```json
{
  "title": "New Card",
  "description": "Optional description",
  "position": 0,
  "dueDate": "2025-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_new",
    "title": "New Card",
    "description": "Optional description",
    "position": 0,
    "listId": "list_456",
    "dueDate": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z"
  },
  "message": "Card created successfully"
}
```

## Cards API

### GET /cards/:id

Retrieve a specific card.

**Parameters:**
- `id` (string): Card ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_789",
    "title": "Task 1",
    "description": "Description of task 1",
    "position": 0,
    "listId": "list_456",
    "dueDate": null,
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z",
    "labels": [],
    "activities": []
  }
}
```

### PUT /cards/:id

Update a card.

**Parameters:**
- `id` (string): Card ID

**Request Body:**
```json
{
  "title": "Updated Card Title",
  "description": "Updated description",
  "position": 1000,
  "dueDate": "2025-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_789",
    "title": "Updated Card Title",
    "description": "Updated description",
    "position": 1000,
    "listId": "list_456",
    "dueDate": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z",
    "labels": [],
    "activities": []
  },
  "message": "Card updated successfully"
}
```

### PUT /cards/:id/move

Move a card to a different list or position.

**Parameters:**
- `id` (string): Card ID

**Request Body:**
```json
{
  "listId": "list_target",
  "position": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_789",
    "title": "Task 1",
    "description": "Description of task 1",
    "position": 500,
    "listId": "list_target",
    "dueDate": null,
    "createdAt": "2025-07-09T10:00:00.000Z",
    "updatedAt": "2025-07-09T10:00:00.000Z",
    "labels": [],
    "activities": []
  },
  "message": "Card moved successfully"
}
```

### DELETE /cards/:id

Delete a card.

**Parameters:**
- `id` (string): Card ID

**Response:**
```json
{
  "success": true,
  "message": "Card deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Position Management

DriftBoard uses a position-based ordering system for lists and cards:

- Positions are positive numbers (typically starting from 0)
- New items get position = max(existing_positions) + 1000
- When items are reordered, other items' positions are automatically adjusted
- Moving items between lists handles position gaps automatically
- The system supports decimal positions for fine-grained ordering

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing rate limiting for security and performance.

## Data Validation

All endpoints validate input data:
- Required fields are enforced
- String fields are trimmed
- Empty strings for required fields are rejected
- Invalid UUIDs are rejected
- Foreign key constraints are enforced (board/list/card relationships)
