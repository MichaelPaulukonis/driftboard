# Security Architecture - DriftBoard

## Security Overview

While DriftBoard starts as a single-user local deployment, security best practices are implemented from the beginning to enable safe public deployment and multi-user functionality in the future.

## Authentication and Authorization

### Firebase Authentication Integration

#### Frontend Authentication Flow
```typescript
// Auth context provider
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get ID token for API calls
        const token = await firebaseUser.getIdToken();
        // Store user data
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName,
          token
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (provider: 'google' | 'github') => {
    const authProvider = provider === 'google' 
      ? new GoogleAuthProvider() 
      : new GithubAuthProvider();
    
    await signInWithPopup(auth, authProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const getIdToken = async () => {
    if (!user) throw new Error('No authenticated user');
    return await auth.currentUser!.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Backend Token Verification
```typescript
// Firebase Admin SDK setup
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const firebaseAdmin = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const adminAuth = getAuth(firebaseAdmin);

// Authentication middleware
export const authMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Attach user info to request
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email!,
      emailVerified: decodedToken.email_verified || false,
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// User creation/update on first login
export const ensureUserExists = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { id, email } = req.user!;
    
    let user = await prisma.user.findUnique({
      where: { firebaseId: id }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseId: id,
          email,
          name: req.user!.name || null,
        }
      });
    }

    req.user!.dbId = user.id;
    next();
  } catch (error) {
    console.error('User creation failed:', error);
    return res.status(500).json({ error: 'User setup failed' });
  }
};
```

### Authorization Patterns

#### Resource-Based Authorization
```typescript
// Authorization middleware for board access
export const authorizeBoard = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const boardId = req.params.boardId || req.body.boardId;
    const userId = req.user!.dbId;

    const board = await prisma.board.findFirst({
      where: { 
        id: boardId, 
        userId: userId 
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    req.board = board;
    next();
  } catch (error) {
    console.error('Board authorization failed:', error);
    return res.status(500).json({ error: 'Authorization failed' });
  }
};

// Usage in routes
router.get('/boards/:boardId', 
  authMiddleware, 
  ensureUserExists, 
  authorizeBoard, 
  getBoardController
);
```

#### Future Multi-User Authorization
```typescript
// Enum for permission levels
enum Permission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

// Board sharing model (future)
model BoardMember {
  id         String     @id @default(uuid())
  boardId    String
  userId     String
  permission Permission @default(READ)
  invitedAt  DateTime   @default(now())
  acceptedAt DateTime?
  
  board      Board      @relation(fields: [boardId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([boardId, userId])
  @@map("board_members")
}

// Permission checking function
const hasPermission = async (
  userId: string, 
  boardId: string, 
  requiredPermission: Permission
): Promise<boolean> => {
  const membership = await prisma.boardMember.findUnique({
    where: { 
      boardId_userId: { boardId, userId } 
    }
  });

  if (!membership) return false;

  const permissionHierarchy = [Permission.READ, Permission.WRITE, Permission.ADMIN];
  const userLevel = permissionHierarchy.indexOf(membership.permission);
  const requiredLevel = permissionHierarchy.indexOf(requiredPermission);

  return userLevel >= requiredLevel;
};
```

## Data Protection and Encryption

### Database Security

#### Data Encryption at Rest
```typescript
// Sensitive data encryption using crypto
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 byte key
const ALGORITHM = 'aes-256-gcm';

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('driftboard', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('driftboard', 'utf8'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Prisma middleware for automatic encryption
prisma.$use(async (params, next) => {
  // Encrypt sensitive fields before saving
  if (params.action === 'create' || params.action === 'update') {
    if (params.model === 'Card' && params.args.data.description) {
      params.args.data.description = encrypt(params.args.data.description);
    }
  }
  
  const result = await next(params);
  
  // Decrypt sensitive fields after retrieving
  if (params.action === 'findUnique' || params.action === 'findMany') {
    if (params.model === 'Card' && result) {
      const cards = Array.isArray(result) ? result : [result];
      cards.forEach(card => {
        if (card.description) {
          card.description = decrypt(card.description);
        }
      });
    }
  }
  
  return result;
});
```

#### Database Connection Security
```typescript
// Secure database configuration
const databaseUrl = new URL(process.env.DATABASE_URL!);

// For production PostgreSQL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
});

// Connection pool configuration
const prismaWithPool = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=20&socket_timeout=60`,
    },
  },
});
```

### Transport Security

#### HTTPS Configuration
```nginx
# nginx.conf for production deployment
server {
    listen 80;
    server_name driftboard.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name driftboard.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/driftboard.crt;
    ssl_certificate_key /etc/ssl/private/driftboard.key;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.driftboard.local; font-src 'self';";
    
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## API Security

### Input Validation and Sanitization
```typescript
// Zod schemas for request validation
import { z } from 'zod';

const CreateBoardSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const CreateCardSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(5000).optional(),
  listId: z.string().uuid(),
  dueDate: z.string().datetime().optional(),
});

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      return res.status(400).json({ error: 'Invalid request data' });
    }
  };
};

// Usage in routes
router.post('/boards', 
  authMiddleware,
  validateRequest(CreateBoardSchema),
  createBoardController
);
```

### Rate Limiting
```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Different limits for different endpoints
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit auth attempts
  skipSuccessfulRequests: true,
});

export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // For sensitive operations
});

// Apply to routes
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/admin', strictLimiter);
```

### CORS Configuration
```typescript
// CORS setup for different environments
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://driftboard.yourdomain.com']
      : ['http://localhost:3000', 'http://localhost:5173'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

## Common Security Vulnerabilities and Mitigations

### SQL Injection Prevention
```typescript
// Using Prisma ORM prevents SQL injection by default
// But for raw queries, use parameterized queries
const getUserBoards = async (userId: string) => {
  // Safe: Prisma handles parameterization
  return prisma.board.findMany({
    where: { userId }
  });
  
  // If using raw SQL (not recommended)
  return prisma.$queryRaw`
    SELECT * FROM boards 
    WHERE user_id = ${userId}
  `;
};

// Never do this:
// const query = `SELECT * FROM boards WHERE user_id = '${userId}'`;
```

### XSS Prevention
```typescript
// Content Security Policy headers (see nginx config above)
// Input sanitization
import DOMPurify from 'isomorphic-dompurify';

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href'],
  });
};

// In React components
const SafeContent: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = useMemo(() => 
    sanitizeHtml(content), [content]
  );
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
```

### CSRF Protection
```typescript
// CSRF middleware
import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  }
});

// Apply to state-changing routes
app.use('/api', csrfProtection);

// Frontend: Include CSRF token in requests
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Add CSRF token to requests
api.interceptors.request.use((config) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (token) {
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});
```

### Dependency Security
```json
// package.json scripts for security
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "security:check": "npm audit && retire --path ./node_modules",
    "deps:update": "npm update && npm audit"
  },
  "devDependencies": {
    "retire": "^3.0.0"
  }
}
```

### Docker Security
```dockerfile
# Secure Dockerfile practices
FROM node:23-alpine AS base

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Security updates
RUN apk update && apk upgrade

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS runtime
WORKDIR /app

# Copy node_modules and app code
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Remove unnecessary files
RUN rm -rf tests docs *.md

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

### Security Monitoring and Logging
```typescript
// Security event logging
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console(),
  ],
});

// Log security events
export const logSecurityEvent = (
  event: string, 
  userId?: string, 
  details?: any
) => {
  securityLogger.warn('Security Event', {
    event,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ip: details?.ip,
    userAgent: details?.userAgent,
  });
};

// Usage in middleware
const authMiddleware = async (req, res, next) => {
  try {
    // ... token verification ...
    next();
  } catch (error) {
    logSecurityEvent('AUTH_FAILURE', undefined, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
    });
    
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
```
