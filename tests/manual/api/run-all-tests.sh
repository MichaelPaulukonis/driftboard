#!/bin/bash

# DriftBoard API Test Runner
# Runs all manual API tests in sequence
#
# Prerequisites:
# 1. Backend server running on http://localhost:8000
# 2. jq installed for JSON formatting
#
# Usage:
#   chmod +x run-all-tests.sh
#   ./run-all-tests.sh

echo "🧪 DriftBoard API Test Suite"
echo "============================"
echo ""

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Server is running on http://localhost:8000"
else
    echo "❌ Server is not running on http://localhost:8000"
    echo "   Please start the server with: cd src/backend && npm run dev"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Some tests may not work properly."
    echo "   Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    echo ""
fi

echo ""
echo "📋 Running Lists CRUD Tests..."
echo "================================"
./lists-crud.sh

echo ""
echo ""
echo "📄 Running Cards CRUD Tests..."
echo "================================"
./cards-crud.sh

echo ""
echo ""
echo "🔄 Running Move Operations Tests..."
echo "==================================="
./move-operations.sh

echo ""
echo ""
echo "🎉 All tests completed!"
echo ""
echo "If any tests failed, check:"
echo "  1. Server is running (npm run dev in src/backend)"
echo "  2. Database has been seeded (npm run seed in root)"
echo "  3. API endpoints are implemented correctly"
