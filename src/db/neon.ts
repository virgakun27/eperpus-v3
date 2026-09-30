import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || '';

export const isDatabaseConfigured = Boolean(
  databaseUrl && 
  !databaseUrl.includes('YOUR_PASSWORD') && 
  !databaseUrl.includes('ep-sample') &&
  databaseUrl.startsWith('postgres')
);

// Create safe query executor with parameterized support
export const getDb = () => {
  if (!isDatabaseConfigured) {
    return null;
  }
  return neon(databaseUrl);
};

export const sql = getDb();
