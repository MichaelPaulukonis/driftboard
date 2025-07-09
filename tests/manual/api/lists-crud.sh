#!/bin/bash

# DriftBoard API Manual Testing Scripts
# Lists CRUD Operations
#
# Prerequisites:
# 1. Backend server running on http://localhost:8000
# 2. Database seeded with test data
# 3. jq installed for JSON formatting (optional)
#
# Usage:
#   chmod +x lists-crud.sh
#   ./lists-crud.sh

BASE_URL="http://localhost:8000/api"
BOARD_ID=""  # Will be fetched from boards API
LIST_ID=""   # Will be captured from create response

echo "=== DriftBoard Lists API Testing ==="
echo ""

# Helper function for formatted output
pretty_print() {
    if command -v jq &> /dev/null; then
        echo "$1" | jq '.'
    else
        echo "$1"
    fi
}

echo "🔍 1. Get existing boards to find a board ID..."
BOARDS_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/boards")

echo "Boards Response:"
pretty_print "$BOARDS_RESPONSE"

# Extract first board ID (assumes jq is available)
if command -v jq &> /dev/null; then
    BOARD_ID=$(echo "$BOARDS_RESPONSE" | jq -r '.data[0].id // empty')
    if [ -z "$BOARD_ID" ]; then
        echo "❌ No boards found. Please create a board first or check if the server is running."
        exit 1
    fi
    echo "✅ Using Board ID: $BOARD_ID"
else
    echo "⚠️  jq not found. Please manually extract a board ID and set BOARD_ID variable."
    echo "   Install jq with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

echo ""
echo "📋 2. Create a new list..."
CREATE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test List Created by Script",
        "position": 0
    }' \
    "$BASE_URL/boards/$BOARD_ID/lists")

echo "Create List Response:"
pretty_print "$CREATE_RESPONSE"

# Extract list ID from response
LIST_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id // empty')
if [ -z "$LIST_ID" ]; then
    echo "❌ Failed to create list or extract list ID"
    exit 1
fi
echo "✅ Created List ID: $LIST_ID"

echo ""
echo "📖 3. Get the specific list..."
GET_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/lists/$LIST_ID")

echo "Get List Response:"
pretty_print "$GET_RESPONSE"

echo ""
echo "✏️  4. Update the list name..."
UPDATE_RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Updated Test List - Modified by Script"
    }' \
    "$BASE_URL/lists/$LIST_ID")

echo "Update List Response:"
pretty_print "$UPDATE_RESPONSE"

echo ""
echo "📊 5. Get board to see the updated list..."
BOARD_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/boards/$BOARD_ID")

echo "Board with Lists Response:"
pretty_print "$BOARD_RESPONSE"

echo ""
echo "🗑️  6. Delete the test list..."
DELETE_RESPONSE=$(curl -s -X DELETE \
    -H "Content-Type: application/json" \
    "$BASE_URL/lists/$LIST_ID")

echo "Delete List Response:"
pretty_print "$DELETE_RESPONSE"

echo ""
echo "✅ 7. Verify list was deleted by getting board again..."
FINAL_BOARD_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/boards/$BOARD_ID")

echo "Final Board Response (list should be gone):"
pretty_print "$FINAL_BOARD_RESPONSE"

echo ""
echo "🎉 Lists CRUD testing complete!"
echo ""
echo "Summary of operations tested:"
echo "  ✅ Create list in board (POST /boards/:id/lists)"
echo "  ✅ Get specific list (GET /lists/:id)"
echo "  ✅ Update list name (PUT /lists/:id)"
echo "  ✅ Delete list (DELETE /lists/:id)"
echo "  ✅ Verify operations via board detail (GET /boards/:id)"
