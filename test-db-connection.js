import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema.js';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL);
const db = drizzle({ client: sql, schema });

async function testConnection() {
  console.log('Testing database connection...');
  try {
    // Test select
    const result = await db.select().from(schema.users).limit(1);
    console.log('✓ Database connection successful');
    console.log('Existing users:', result.length);
    
    // Test insert
    const passwordHash = await bcrypt.hash('test123456', 12);
    const newUser = await db.insert(schema.users)
      .values({
        email: `test_${Date.now()}@example.com`,
        name: 'Test User',
        passwordHash,
      })
      .returning();
    console.log('✓ User insert successful');
    console.log('Inserted user:', newUser[0].id, newUser[0].email);
    
    // Clean up
    await db.delete(schema.users).where(schema.eq(schema.users.id, newUser[0].id));
    console.log('✓ Cleanup successful');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
