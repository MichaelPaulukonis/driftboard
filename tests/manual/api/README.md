# API Manual Testing Guide

This directory contains manual testing scripts for the DriftBoard API endpoints. These scripts use `curl` to test API functionality during development.

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd src/backend
   npm run dev
   ```
   Server should be accessible at `http://localhost:8000`

2. **Database Seeded** (optional but recommended)
   ```bash
   npm run seed
   ```

3. **jq Installed** (for JSON formatting)
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   apt-get install jq
   
   # Windows (WSL)
   sudo apt-get install jq
   ```

## Available Test Scripts

### 1. `lists-crud.sh` - Lists API Testing
Tests all CRUD operations for lists:
- ✅ Create list in board (`POST /boards/:id/lists`)
- ✅ Get specific list (`GET /lists/:id`)
- ✅ Update list name (`PUT /lists/:id`)
- ✅ Delete list (`DELETE /lists/:id`)

```bash
./lists-crud.sh
```

### 2. `cards-crud.sh` - Cards API Testing
Tests all CRUD operations for cards:
- ✅ Create card in list (`POST /lists/:id/cards`)
- ✅ Get specific card (`GET /cards/:id`)
- ✅ Update card title/description (`PUT /cards/:id`)
- ✅ Delete card (`DELETE /cards/:id`)

```bash
./cards-crud.sh
```

### 3. `move-operations.sh` - Drag & Drop Testing
Tests card movement and reordering:
- ✅ Move card between lists (`PUT /cards/:id/move`)
- ✅ Reorder cards within list (`PUT /cards/:id`)
- ✅ Position calculations
- ✅ Database persistence

```bash
./move-operations.sh
```

### 4. `run-all-tests.sh` - Complete Test Suite
Runs all tests in sequence with setup validation:

```bash
./run-all-tests.sh
```

## Expected API Endpoints

Based on the Phase 1 completion plan, these endpoints should be implemented:

### Lists Endpoints
```http
GET    /api/lists/:id                # Get list with cards
PUT    /api/lists/:id                # Update list name/position
DELETE /api/lists/:id                # Delete list
POST   /api/boards/:id/lists         # Create list in board
```

### Cards Endpoints
```http
GET    /api/cards/:id                # Get card details
PUT    /api/cards/:id                # Update card
DELETE /api/cards/:id                # Delete card
POST   /api/lists/:id/cards          # Create card in list
PUT    /api/cards/:id/move           # Move card between lists
```

## Using the Scripts

### Quick Start
```bash
# Make scripts executable
chmod +x *.sh

# Run all tests
./run-all-tests.sh
```

### Individual Testing
```bash
# Test just lists
./lists-crud.sh

# Test just cards
./cards-crud.sh

# Test move operations
./move-operations.sh
```

## Sample Output

Each script provides detailed output showing:
- 📋 Operation being performed
- 🔍 Request details
- ✅ Response validation
- 📊 Current state verification

Example output:
```
=== DriftBoard Lists API Testing ===

🔍 1. Get existing boards to find a board ID...
✅ Using Board ID: cm123abc456

📋 2. Create a new list...
✅ Created List ID: cm789def012

📖 3. Get the specific list...
{
  "success": true,
  "data": {
    "id": "cm789def012",
    "name": "Test List Created by Script",
    "position": 0,
    "cards": []
  }
}
```

## Troubleshooting

### Server Not Running
```
❌ Server is not running on http://localhost:8000
   Please start the server with: cd src/backend && npm run dev
```

### No Test Data
```
❌ No boards found. Please create a board first or check if the server is running.
```
**Solution**: Run `npm run seed` to create test data

### Missing jq
```
⚠️  jq not found. Please manually extract a board ID and set BOARD_ID variable.
   Install jq with: brew install jq (macOS) or apt-get install jq (Ubuntu)
```

### API Endpoint Not Implemented
```
{
  "success": false,
  "error": "Route not found",
  "message": "Lists routes not yet implemented"
}
```
**Solution**: Implement the missing API endpoint

## Implementation Progress Tracking

Use these scripts to verify implementation progress:

### ✅ Phase 1 MVP Requirements
- [x] Boards API (already working)
- [ ] Lists API (test with `./lists-crud.sh`)
- [ ] Cards API (test with `./cards-crud.sh`) 
- [ ] Move operations (test with `./move-operations.sh`)

### Test Status After Implementation
```bash
# Check individual features
./lists-crud.sh     # Should pass when lists API is complete
./cards-crud.sh     # Should pass when cards API is complete
./move-operations.sh # Should pass when move API is complete

# Full validation
./run-all-tests.sh  # Should pass when Phase 1 is complete
```

## Integration with Development Workflow

1. **Write API endpoint**
2. **Run corresponding test script**
3. **Fix issues found**
4. **Repeat until test passes**
5. **Move to next endpoint**

This approach ensures each API endpoint works correctly before moving to the next feature.
