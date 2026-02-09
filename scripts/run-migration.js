require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  
  // Read migration file
  const migrationPath = path.join(__dirname, '../lib/db/migrations/remove-act-hierarchy.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('🔄 Running migration: remove-act-hierarchy.sql');
  console.log('📝 Migration content:');
  console.log(migrationSQL);
  console.log('\n🚀 Executing...\n');
  
  try {
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        await sql(statement);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Changes applied:');
    console.log('  - Added chapter_order column to chapters');
    console.log('  - Added act_tag column to chapters');
    console.log('  - Removed act_id foreign key constraint');
    console.log('  - Removed old unique constraint (act_id, chapter_number)');
    console.log('  - Added new unique constraint (volume_id, chapter_number)');
    console.log('  - Dropped act_id column');
    console.log('\n✨ Chapters are now direct children of volumes!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
