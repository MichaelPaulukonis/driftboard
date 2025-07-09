# Manual Testing Guide

This guide provides instructions for manually testing the DriftBoard API endpoints using curl scripts and other manual testing procedures.

## Prerequisites

- DriftBoard backend server running on `http://localhost:8000`
- `curl` command-line tool installed
- `jq` (optional, for pretty-printing JSON responses)

## Quick Start

1. Start the backend server:
   ```bash
   cd /Users/michaelpaulukonis/projects/driftboard
   npm run dev:backend
   ```

2. Run all manual tests:
   ```bash
   cd tests/manual/api
   ./run-all-tests.sh
   ```

## Manual Test Scripts

All manual test scripts are located in `tests/manual/api/` directory:

### Available Scripts

1. **`lists-crud.sh`** - Tests all list operations (CRUD + position management)
2. **`cards-crud.sh`** - Tests all card operations (CRUD + updates)  
3. **`move-operations.sh`** - Tests card move operations between lists
4. **`run-all-tests.sh`** - Runs all test scripts in sequence

### Running Individual Tests

```bash
# Test lists functionality
./tests/manual/api/lists-crud.sh

# Test cards functionality  
./tests/manual/api/cards-crud.sh

# Test move operations
./tests/manual/api/move-operations.sh
```

## Test Scenarios Covered

### Health Check
- ✅ API health status endpoint
- ✅ Server uptime and version info

### Boards API
- ✅ Get all boards
- ✅ Get specific board with lists and cards
- ✅ Create new board
- ✅ Update board details
- ✅ Delete board
- ✅ Create list in board

### Lists API
- ✅ Get list with cards
- ✅ Update list name and position
- ✅ Delete list (cascades to cards)
- ✅ Position reordering logic
- ✅ Error handling for invalid requests

### Cards API
- ✅ Create card in list
- ✅ Get card details
- ✅ Update card title, description, position
- ✅ Delete card
- ✅ Position management within list

### Move Operations
- ✅ Move card to different list
- ✅ Reorder card within same list
- ✅ Position calculation and gap filling
- ✅ Error handling for invalid moves

## Manual Testing Procedure

### 1. Health Check

```bash
curl -X GET http://localhost:8000/api/health | jq
```

Expected: `200 OK` with status "healthy"

### 2. Board Operations

```bash
# Get all boards
curl -X GET http://localhost:8000/api/boards | jq

# Create a test board
curl -X POST http://localhost:8000/api/boards \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Board","description":"Manual testing board"}' | jq

# Get board with ID (replace BOARD_ID)
curl -X GET http://localhost:8000/api/boards/BOARD_ID | jq
```

### 3. List Operations

```bash
# Create a list in board (replace BOARD_ID)
curl -X POST http://localhost:8000/api/boards/BOARD_ID/lists \
  -H "Content-Type: application/json" \
  -d '{"name":"Test List","position":0}' | jq

# Get list details (replace LIST_ID)
curl -X GET http://localhost:8000/api/lists/LIST_ID | jq

# Update list
curl -X PUT http://localhost:8000/api/lists/LIST_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated List","position":1000}' | jq
```

### 4. Card Operations

```bash
# Create card in list (replace LIST_ID)
curl -X POST http://localhost:8000/api/lists/LIST_ID/cards \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Card","description":"Manual test card","position":0}' | jq

# Get card details (replace CARD_ID)
curl -X GET http://localhost:8000/api/cards/CARD_ID | jq

# Update card
curl -X PUT http://localhost:8000/api/cards/CARD_ID \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Card","description":"Updated description"}' | jq

# Move card to different list (replace LIST_TARGET_ID)
curl -X PUT http://localhost:8000/api/cards/CARD_ID/move \
  -H "Content-Type: application/json" \
  -d '{"listId":"LIST_TARGET_ID","position":500}' | jq
```

### 5. Error Testing

```bash
# Test with invalid board ID
curl -X GET http://localhost:8000/api/boards/invalid-id | jq

# Test with empty required fields
curl -X POST http://localhost:8000/api/boards \
  -H "Content-Type: application/json" \
  -d '{"name":"","description":"Empty name test"}' | jq

# Test moving card to non-existent list
curl -X PUT http://localhost:8000/api/cards/CARD_ID/move \
  -H "Content-Type: application/json" \
  -d '{"listId":"non-existent-id","position":0}' | jq
```

## Automated Test Scripts Details

### lists-crud.sh

Tests the complete lifecycle of list management:

1. **Setup**: Gets a board ID for testing
2. **Create**: Creates a new list with position 0
3. **Read**: Retrieves the created list
4. **Update**: Updates list name and position
5. **Create Second**: Creates another list for position testing
6. **Position Test**: Updates first list position to test reordering
7. **Delete**: Removes both test lists
8. **Cleanup**: Verifies lists are deleted

### cards-crud.sh

Tests the complete lifecycle of card management:

1. **Setup**: Gets board and list IDs for testing
2. **Create**: Creates a new card with title and description
3. **Read**: Retrieves the created card
4. **Update Title**: Updates card title
5. **Update Description**: Updates card description
6. **Update Position**: Changes card position
7. **Delete**: Removes the test card
8. **Cleanup**: Verifies card is deleted

### move-operations.sh

Tests card movement scenarios:

1. **Setup**: Creates board, lists, and cards for testing
2. **Same List Move**: Moves card to different position in same list
3. **Different List Move**: Moves card to different list
4. **Position Verification**: Checks that positions are updated correctly
5. **Error Testing**: Tests invalid move scenarios
6. **Cleanup**: Removes all test data

## Expected Results

### Successful Operations
- HTTP status codes: 200 (GET, PUT, DELETE) or 201 (POST)
- Response format: `{"success": true, "data": {...}, "message": "..."}`
- Data integrity: IDs, timestamps, relationships preserved

### Error Cases
- HTTP status codes: 400 (validation), 404 (not found), 500 (server error)
- Response format: `{"success": false, "error": "error message"}`
- Appropriate error messages for each failure type

### Position Management
- New items get auto-assigned positions (typically increments of 1000)
- Reordering updates other items' positions automatically
- No duplicate positions in same container (list/board)
- Gaps in positions are filled when items are moved/deleted

## Troubleshooting

### Common Issues

1. **Server not running**
   ```bash
   # Check if server is running
   curl -f http://localhost:8000/api/health || echo "Server not responding"
   ```

2. **Database locked**
   ```bash
   # Restart the backend server
   npm run dev:backend
   ```

3. **Invalid JSON in response**
   - Check server logs for errors
   - Ensure Content-Type header is set for POST/PUT requests

4. **Permission errors**
   ```bash
   # Make scripts executable
   chmod +x tests/manual/api/*.sh
   ```

### Debugging Tips

1. **Add verbose output to curl**:
   ```bash
   curl -v -X GET http://localhost:8000/api/health
   ```

2. **Save responses for inspection**:
   ```bash
   curl -X GET http://localhost:8000/api/boards > boards_response.json
   ```

3. **Check server logs**:
   - Look at terminal where `npm run dev:backend` is running
   - Check for error messages and stack traces

4. **Validate JSON syntax**:
   ```bash
   echo '{"name":"test"}' | jq '.' # Should pretty-print if valid
   ```

## Integration with Automated Tests

The manual tests complement the automated integration tests:

- **Manual tests**: Good for exploratory testing, debugging, and verification
- **Integration tests**: Good for regression testing and CI/CD
- **Both**: Cover the same API endpoints but with different approaches

Run both types of tests to ensure comprehensive coverage:

```bash
# Run manual tests
./tests/manual/api/run-all-tests.sh

# Run automated integration tests  
npm run test:integration
```

## Next Steps

After manual testing is complete, consider:

1. **Frontend Integration**: Test API endpoints from the React frontend
2. **Performance Testing**: Test with larger datasets and concurrent requests
3. **Security Testing**: Test authentication, authorization, and input validation
4. **Documentation Updates**: Keep this guide updated as API evolves
