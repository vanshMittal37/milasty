import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@db.vwstzycakjwjogtojzzg.supabase.co:5432/postgres';

async function checkTables() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Connected to DB successfully.');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Existing tables in public schema:');
    console.log(res.rows.map(r => r.table_name));

    // Also check if any table matching inquiry or contact exists
    const matchRes = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND (table_name LIKE '%inquir%' OR table_name LIKE '%contact%')
      ORDER BY table_name, ordinal_position;
    `);
    console.log('Matching inquiry/contact tables/columns:');
    console.log(matchRes.rows);

  } catch (err) {
    console.error('Error connecting or querying DB:', err);
  } finally {
    await client.end();
  }
}

checkTables();
