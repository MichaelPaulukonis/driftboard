import path from 'path';
import { config } from 'dotenv';

// Load environment variables from the backend .env file
const backendEnvPath = path.resolve(__dirname, '../src/backend/.env');

config({ path: backendEnvPath });

// Set an absolute path for the database file
const dbPath = path.resolve(__dirname, '../prisma/data/app.db');
process.env.DATABASE_URL = `file:${dbPath}`;
