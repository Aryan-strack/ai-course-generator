import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// This checks if we have the connection string and creates the DB connection
const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
