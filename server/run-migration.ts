import 'dotenv/config';
import { db } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('🔧 Running database migrations...');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order
    
    for (const file of migrationFiles) {
      console.log(`📝 Running migration: ${file}`);
      
      // Read the migration file
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute the migration
      await db.execute(sql.raw(migrationSQL));
      
      console.log(`✅ Migration ${file} completed successfully!`);
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 