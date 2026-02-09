import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure with longer timeout and connection pooling
export const sql = neon(process.env.DATABASE_URL, {
  fetchConnectionCache: true,
  fetchOptions: {
    // Increase timeout to 30 seconds for long-running queries
    signal: AbortSignal.timeout(30000),
  },
});
