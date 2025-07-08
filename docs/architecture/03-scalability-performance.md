# Scalability & Performance Architecture - DriftBoard

## Performance Considerations

While scalability is not an immediate concern for this single-user application, the architecture is designed with future growth in mind. This document outlines current performance optimizations and scalability pathways.

## Current Performance Optimizations

### Frontend Performance

#### React Optimizations
```typescript
// Component memoization for expensive renders
const CardComponent = React.memo(({ card, onUpdate }) => {
  return <Card card={card} onUpdate={onUpdate} />;
});

// Virtualized lists for large boards
import { FixedSizeList as List } from 'react-window';

const VirtualizedCardList = ({ cards, height }) => (
  <List
    height={height}
    itemCount={cards.length}
    itemSize={80}
    itemData={cards}
  >
    {CardRow}
  </List>
);

// Lazy loading for large components
const BoardSettings = lazy(() => import('./BoardSettings'));
const CardEditModal = lazy(() => import('./CardEditModal'));
```

#### Bundle Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Unused code elimination via Vite
- **Asset Optimization**: Image compression and modern formats (WebP)
- **Bundle Analysis**: Regular bundle size monitoring

#### State Management Performance
```typescript
// Normalized state structure for O(1) lookups
interface BoardsState {
  boards: { [id: string]: Board };
  lists: { [id: string]: List };
  cards: { [id: string]: Card };
  boardListIds: string[];
  listCardIds: { [listId: string]: string[] };
}

// Memoized selectors
const selectBoardCards = createSelector(
  [selectCards, selectCurrentBoardLists],
  (cards, lists) => {
    return lists.flatMap(list => 
      list.cardIds.map(cardId => cards[cardId])
    );
  }
);
```

### Backend Performance

#### Database Optimization
```sql
-- Optimized indexes for common queries
CREATE INDEX idx_boards_user_id ON boards(user_id);
CREATE INDEX idx_lists_board_id ON lists(board_id);
CREATE INDEX idx_cards_list_id ON cards(list_id);
CREATE INDEX idx_cards_due_date ON cards(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_activities_card_id_created_at ON activities(card_id, created_at);

-- Composite indexes for complex queries
CREATE INDEX idx_cards_list_position ON cards(list_id, position);
CREATE INDEX idx_boards_user_archived ON boards(user_id, archived);
```

#### API Performance
```typescript
// Efficient data loading with Prisma
const getBoardWithDetails = async (boardId: string, userId: string) => {
  return prisma.board.findFirst({
    where: { id: boardId, userId },
    include: {
      lists: {
        orderBy: { position: 'asc' },
        include: {
          cards: {
            orderBy: { position: 'asc' },
            include: {
              labels: true,
              _count: {
                select: { comments: true, activities: true }
              }
            }
          }
        }
      }
    }
  });
};

// Pagination for large datasets
const getCardActivities = async (cardId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return prisma.activity.findMany({
    where: { cardId },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  });
};
```

#### Response Optimization
- **Compression**: Gzip/Brotli compression via Nginx
- **Caching Headers**: Appropriate cache-control headers
- **Response Size**: Field selection and pagination
- **Connection Pooling**: Prisma connection optimization

## Scalability Pathways

### Phase 1: Enhanced Single User (Current)
**Target**: 1 user, 50+ boards, 1000+ cards
- Current architecture with optimizations
- SQLite with WAL mode for better concurrent access
- In-memory caching for frequently accessed data

### Phase 2: Multi-User (Months 3-6)
**Target**: 10-50 users, shared boards
- Migrate from SQLite to PostgreSQL
- Add Redis for session management and caching
- Implement real-time updates with WebSockets
- Add user permissions and board sharing

### Phase 3: Small Team (Year 1)
**Target**: 100-500 users, team workspaces
- Horizontal scaling with load balancer
- Database read replicas
- CDN for static assets
- Advanced caching strategies

### Phase 4: Enterprise (Future)
**Target**: 1000+ users, organizations
- Microservices architecture
- Message queue system (Redis/RabbitMQ)
- Database sharding
- Auto-scaling infrastructure

## Performance Bottlenecks and Solutions

### Identified Bottlenecks

#### 1. Large Board Rendering
**Problem**: Boards with 100+ cards cause UI lag
```typescript
// Solution: Virtual scrolling and progressive loading
const useVirtualizedBoard = (boardId: string) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  
  return useMemo(() => {
    return cards.slice(visibleRange.start, visibleRange.end);
  }, [cards, visibleRange]);
};
```

#### 2. Real-time Drag and Drop
**Problem**: Position updates cause database thrashing
```typescript
// Solution: Debounced position updates
const useDebouncedPositionUpdate = () => {
  const updatePosition = useMemo(
    () => debounce(async (cardId, newPosition) => {
      await updateCardPosition({ cardId, position: newPosition });
    }, 500),
    []
  );
  
  return updatePosition;
};
```

#### 3. Search Performance
**Problem**: Text search across all cards is slow
```sql
-- Solution: Full-text search indexes
CREATE VIRTUAL TABLE cards_fts USING fts5(
  title, description, content='cards', content_rowid='id'
);

-- Triggers to keep FTS table updated
CREATE TRIGGER cards_fts_insert AFTER INSERT ON cards BEGIN
  INSERT INTO cards_fts(rowid, title, description) 
  VALUES (new.id, new.title, new.description);
END;
```

### Performance Monitoring

#### Frontend Monitoring
```typescript
// Performance tracking
const usePerformanceTracking = () => {
  useEffect(() => {
    // Track Core Web Vitals
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  }, []);
};

// Bundle size monitoring
const bundleAnalyzer = require('webpack-bundle-analyzer');
// Run after build to analyze bundle composition
```

#### Backend Monitoring
```typescript
// Request timing middleware
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request performance', {
      method: req.method,
      url: req.url,
      duration,
      statusCode: res.statusCode
    });
  });
  
  next();
};

// Database query performance
const prismaWithLogging = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const start = Date.now();
        const result = await query(args);
        const end = Date.now();
        
        console.log(`${model}.${operation} took ${end - start}ms`);
        return result;
      },
    },
  },
});
```

## Caching Strategies

### Multi-Layer Caching Architecture

#### Layer 1: Browser Cache
```typescript
// Service Worker for offline functionality
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

#### Layer 2: Application Cache (Redux + RTK Query)
```typescript
// RTK Query cache configuration
export const boardsApi = createApi({
  reducerPath: 'boardsApi',
  tagTypes: ['Board', 'List', 'Card'],
  keepUnusedDataFor: 300, // 5 minutes
  endpoints: (builder) => ({
    getBoard: builder.query({
      query: (id) => `boards/${id}`,
      providesTags: (result, error, id) => [{ type: 'Board', id }],
      // Cache for 10 minutes
      keepUnusedDataFor: 600,
    }),
  }),
});
```

#### Layer 3: Server-Side Cache (Redis - Future)
```typescript
// Redis caching layer
class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Usage in service layer
class BoardService {
  async findById(id: string): Promise<Board> {
    const cacheKey = `board:${id}`;
    const cached = await this.cache.get<Board>(cacheKey);
    
    if (cached) return cached;
    
    const board = await this.repository.findById(id);
    await this.cache.set(cacheKey, board, 1800); // 30 minutes
    
    return board;
  }
}
```

#### Layer 4: Database Query Cache
```typescript
// Prisma query caching
const cachedPrisma = prisma.$extends({
  query: {
    board: {
      findMany: async ({ args, query }) => {
        const cacheKey = `boards:${JSON.stringify(args)}`;
        
        // Check cache first
        const cached = await cache.get(cacheKey);
        if (cached) return cached;
        
        // Execute query and cache result
        const result = await query(args);
        await cache.set(cacheKey, result, 300);
        
        return result;
      },
    },
  },
});
```

## Load Balancing Considerations (Future)

### Application Load Balancing
```yaml
# docker-compose.yml for scaled deployment
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api-1
      - api-2
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf

  api-1:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/driftboard

  api-2:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/driftboard

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: driftboard
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
```

### Database Load Balancing
```typescript
// Read/Write splitting for scaled databases
class DatabaseService {
  constructor(
    private writeDb: PrismaClient,
    private readDb: PrismaClient
  ) {}

  // Write operations go to primary
  async create(data: any) {
    return this.writeDb.board.create({ data });
  }

  // Read operations can use replica
  async findMany(args: any) {
    return this.readDb.board.findMany(args);
  }
}
```

### Session Management for Scale
```typescript
// Redis-based session store
class SessionStore {
  constructor(private redis: Redis) {}

  async set(sessionId: string, data: SessionData): Promise<void> {
    await this.redis.setex(
      `session:${sessionId}`,
      3600, // 1 hour
      JSON.stringify(data)
    );
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

## Resource Optimization

### Docker Optimization
```dockerfile
# Multi-stage build for smaller images
FROM node:23-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:23-alpine AS runtime
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
USER nodejs
EXPOSE 3000
CMD ["npm", "start"]
```

### Memory Management
```typescript
// Graceful memory management
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  await prisma.$disconnect();
  
  // Close Redis connections
  await redis.quit();
  
  // Close HTTP server
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
```
