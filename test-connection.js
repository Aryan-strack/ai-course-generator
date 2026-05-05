const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL);

console.log('Testing database connection...');

sql`SELECT 1+1 as result`
  .then(rows => {
    console.log('Query result:', rows);
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    console.error('Full error:', err);
  });
