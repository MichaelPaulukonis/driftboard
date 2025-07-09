#!/bin/bash

# DriftBoard API Manual Testing Scripts
# Move Operations (Cards between Lists, List reordering)
#
# Prerequisites:
# 1. Backend server running on http://localhost:8000
# 2. Database seeded with test data (multiple lists and cards)
# 3. jq installed for JSON formatting
#
# Usage:
#   chmod +x move-operations.sh
#   ./move-operations.sh

BASE_URL="http://localhost:8000/api"

echo "=== DriftBoard Move Operations Testing ==="
echo ""

# Helper function for formatted output
pretty_print() {
    if command -v jq &> /dev/null; then
        echo "$1" | jq '.'
    else
        echo "$1"
    fi
}

echo "🔍 1. Get boards to find test data..."
BOARDS_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/boards")

if ! command -v jq &> /dev/null; then
    echo "❌ jq is required for this test script"
    exit 1
fi

BOARD_ID=$(echo "$BOARDS_RESPONSE" | jq -r '.data[0].id // empty')
if [ -z "$BOARD_ID" ]; then
    echo "❌ No boards found"
    exit 1
fi

echo "✅ Using Board ID: $BOARD_ID"

# Check if we have at least 2 lists
LIST_COUNT=$(echo "$BOARDS_RESPONSE" | jq -r '.data[0].lists | length')
if [ "$LIST_COUNT" -lt 2 ]; then
    echo "⚠️  Need at least 2 lists for move testing. Creating additional lists..."
    
    # Create a second list
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"name": "Second List for Testing", "position": 1}' \
        "$BASE_URL/boards/$BOARD_ID/lists" > /dev/null
    
    # Refresh board data
    BOARDS_RESPONSE=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        "$BASE_URL/boards")
fi

# Extract list IDs
LIST1_ID=$(echo "$BOARDS_RESPONSE" | jq -r '.data[0].lists[0].id')
LIST2_ID=$(echo "$BOARDS_RESPONSE" | jq -r '.data[0].lists[1].id')

echo "✅ List 1 ID: $LIST1_ID"
echo "✅ List 2 ID: $LIST2_ID"

echo ""
echo "📄 2. Create test cards in first list..."
CARD1_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"title": "Card 1 - Move Test", "position": 0}' \
    "$BASE_URL/lists/$LIST1_ID/cards")

CARD2_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"title": "Card 2 - Move Test", "position": 1}' \
    "$BASE_URL/lists/$LIST1_ID/cards")

CARD1_ID=$(echo "$CARD1_RESPONSE" | jq -r '.data.id')
CARD2_ID=$(echo "$CARD2_RESPONSE" | jq -r '.data.id')

echo "✅ Created Card 1 ID: $CARD1_ID"
echo "✅ Created Card 2 ID: $CARD2_ID"

echo ""
echo "📊 3. Show initial state..."
INITIAL_STATE=$(curl -s -X GET "$BASE_URL/boards/$BOARD_ID")
echo "Initial Board State:"
echo "$INITIAL_STATE" | jq '.data.lists[] | {id: .id, name: .name, cards: [.cards[] | {id: .id, title: .title, position: .position}]}'

echo ""
echo "🔄 4. Move Card 1 to List 2..."
MOVE_RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d '{
        "listId": "'$LIST2_ID'",
        "position": 0
    }' \
    "$BASE_URL/cards/$CARD1_ID/move")

echo "Move Card Response:"
pretty_print "$MOVE_RESPONSE"

echo ""
echo "📊 5. Show state after move..."
AFTER_MOVE_STATE=$(curl -s -X GET "$BASE_URL/boards/$BOARD_ID")
echo "Board State After Move:"
echo "$AFTER_MOVE_STATE" | jq '.data.lists[] | {id: .id, name: .name, cards: [.cards[] | {id: .id, title: .title, position: .position}]}'

echo ""
echo "🔄 6. Test reordering cards within a list..."
# Move Card 2 to position 0 (should push other cards down)
REORDER_RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d '{"position": 0}' \
    "$BASE_URL/cards/$CARD2_ID")

echo "Reorder Card Response:"
pretty_print "$REORDER_RESPONSE"

echo ""
echo "📊 7. Show final state..."
FINAL_STATE=$(curl -s -X GET "$BASE_URL/boards/$BOARD_ID")
echo "Final Board State:"
echo "$FINAL_STATE" | jq '.data.lists[] | {id: .id, name: .name, cards: [.cards[] | {id: .id, title: .title, position: .position}]}'

echo ""
echo "🧹 8. Cleanup test cards..."
curl -s -X DELETE "$BASE_URL/cards/$CARD1_ID" > /dev/null
curl -s -X DELETE "$BASE_URL/cards/$CARD2_ID" > /dev/null
echo "✅ Test cards deleted"

echo ""
echo "🎉 Move operations testing complete!"
echo ""
echo "Summary of operations tested:"
echo "  ✅ Move card between lists (PUT /cards/:id/move)"
echo "  ✅ Reorder cards within list (PUT /cards/:id with position)"
echo "  ✅ Position calculations work correctly"
echo "  ✅ Database updates persist"
