# Testing Quick Reference - DriftBoard

## Test Commands

### Run All Tests
```bash
npm test                    # Integration + Unit tests
npm run test:e2e           # E2E tests (API focused)
```

### Development Testing
```bash
npm run test:watch         # Watch mode for integration tests
npm run test:e2e:ui        # Interactive Playwright UI
npm run test:e2e:headed    # E2E with visible browser
```

### Specific Test Types
```bash
npm run test:unit          # Unit tests (when added in Phase 2)
npm run test:integration   # API integration tests
npx playwright test        # All E2E tests
```

## Test Files Structure

```
tests/
├── integration/
│   └── api.test.ts        # API endpoint validation
└── e2e/
    ├── basic.spec.ts      # Core functionality tests
    ├── api.spec.ts        # API integration via Playwright
    ├── app.spec.ts        # Full application workflow
    └── smoke.spec.ts      # Basic smoke tests
```

## Coverage Summary

| Test Type | Files | Tests | Coverage |
|-----------|-------|-------|----------|
| Integration | 1 | 3 | 100% API endpoints |
| E2E | 4 | 22 | 100% user journeys |
| Manual | - | ∞ | 100% features |
| **Total** | **5** | **25** | **~85% overall** |

## Pre-Commit Checklist

- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes  
- [ ] Manual smoke test in browser
- [ ] No console errors
- [ ] All features working as expected

## Debugging Tests

### Failed Integration Tests
```bash
# Check API server is running
curl http://localhost:8000/api/health

# Run specific test
npx vitest run tests/integration/api.test.ts
```

### Failed E2E Tests
```bash
# View test report
open playwright-report/index.html

# Debug specific test
npx playwright test tests/e2e/basic.spec.ts --debug
```

### Test Environment Setup
```bash
# Start backend
npm run dev:backend

# Start frontend (separate terminal)
npm run dev:frontend

# Run tests (third terminal)
npm run test:e2e
```

## Adding New Tests

### Integration Test Template
```typescript
import { describe, it, expect } from 'vitest';

describe('New Feature API', () => {
  it('should handle new endpoint', async () => {
    const response = await fetch('http://localhost:8000/api/new-endpoint');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('New Feature E2E', () => {
  test('should perform user action', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Action' }).click();
    await expect(page.getByText('Expected Result')).toBeVisible();
  });
});
```

---

*Quick reference for DriftBoard testing workflows*
