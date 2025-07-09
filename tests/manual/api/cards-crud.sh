#!/bin/bash

# DriftBoard API Manual Testing Scripts
# Cards CRUD Operations
#
# Prerequisites:
# 1. Backend server running on http://localhost:8000
# 2. Database seeded with test data (at least one board and list)
# 3. jq installed for JSON formatting (optional)
#
# Usage:
#   chmod +x cards-crud.sh
#   ./cards-crud.sh

BASE_URL="http://localhost:8000/api"
BOARD_ID=""
LIST_ID=""
CARD_ID=""

echo "=== DriftBoard Cards API Testing ==="
echo ""

# Helper function for formatted output
pretty_print() {
    if command -v jq &> /dev/null; then
        echo "$1" | jq '.'
    else
        echo "$1"
    fi
}

echo "🔍 1. Get existing boards and lists to find IDs..."
BOARDS_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/boards")

echo "Boards Response:"
pretty_print "$BOARDS_RESPONSE"

# Extract board and list IDs
if command -v jq &> /dev/null; then
    BOARD_ID=$(echo "$BOARDS_RESPONSE" | jq -r '.data[0].id // empty')
    LIST_ID=$(echo "$BOARDS_RESPONSE" | jq -r '.data[0].lists[0].id // empty')
    
    if [ -z "$BOARD_ID" ] || [ -z "$LIST_ID" ]; then
        echo "❌ No boards or lists found. Please ensure you have test data."
        echo "   Board ID: $BOARD_ID"
        echo "   List ID: $LIST_ID"
        exit 1
    fi
    echo "✅ Using Board ID: $BOARD_ID"
    echo "✅ Using List ID: $LIST_ID"
else
    echo "⚠️  jq not found. Please manually extract IDs and set variables."
    exit 1
fi

echo ""
echo "📄 2. Create a new card..."
CREATE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Test Card Created by Script",
        "description": "This card was created by the automated test script.",
        "position": 0
    }' \
    "$BASE_URL/lists/$LIST_ID/cards")

echo "Create Card Response:"
pretty_print "$CREATE_RESPONSE"

# Extract card ID from response
CARD_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id // empty')
if [ -z "$CARD_ID" ]; then
    echo "❌ Failed to create card or extract card ID"
    exit 1
fi
echo "✅ Created Card ID: $CARD_ID"

echo ""
echo "📖 3. Get the specific card..."
GET_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/cards/$CARD_ID")

echo "Get Card Response:"
pretty_print "$GET_RESPONSE"

echo ""
echo "✏️  4. Update the card..."
UPDATE_RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Updated Test Card - Modified by Script",
        "description": "This card description was updated by the test script."
    }' \
    "$BASE_URL/cards/$CARD_ID")

echo "Update Card Response:"
pretty_print "$UPDATE_RESPONSE"

echo ""
echo "📊 5. Get board to see the updated card..."
BOARD_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/boards/$BOARD_ID")

echo "Board with Updated Card:"
echo "$BOARD_RESPONSE" | jq '.data.lists[] | select(.id == "'$LIST_ID'") | .cards'

echo ""
echo "🔄 6. Test moving card (if you have multiple lists)..."
# This will be implemented when move endpoint is ready
echo "Move operation will be tested when multiple lists are available"

echo ""
echo "🗑️  7. Delete the test card..."
DELETE_RESPONSE=$(curl -s -X DELETE \
    -H "Content-Type: application/json" \
    "$BASE_URL/cards/$CARD_ID")

echo "Delete Card Response:"
pretty_print "$DELETE_RESPONSE"

echo ""
echo "✅ 8. Verify card was deleted..."
FINAL_BOARD_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/boards/$BOARD_ID")

echo "Final Board Response (card should be gone):"
echo "$FINAL_BOARD_RESPONSE" | jq '.data.lists[] | select(.id == "'$LIST_ID'") | .cards'

echo ""
echo "🎉 Cards CRUD testing complete!"
echo ""
echo "Summary of operations tested:"
echo "  ✅ Create card in list (POST /lists/:id/cards)"
echo "  ✅ Get specific card (GET /cards/:id)"
echo "  ✅ Update card title/description (PUT /cards/:id)"
echo "  ✅ Delete card (DELETE /cards/:id)"
echo "  ✅ Verify operations via board detail (GET /boards/:id)"
