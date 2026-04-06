const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function fix() {
    try {
        console.log('Verifying and fixing database schema...');
        
        // Ensure lowercase columns for Postgres compatibility
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "firstname" TEXT;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastname" TEXT;`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "profilepic" TEXT;`;
        
        // Transfer data if old columns exist (case sensitive)
        try {
            await sql`UPDATE users SET "firstname" = "firstName" WHERE "firstname" IS NULL;`;
            await sql`UPDATE users SET "lastname" = "lastName" WHERE "lastname" IS NULL;`;
            await sql`UPDATE users SET "profilepic" = "profilePic" WHERE "profilepic" IS NULL;`;
        } catch (e) {
            console.log('No camelCase columns found to transfer data from.');
        }

        console.log('Fixing tasks table...');
        await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "taskdate" TEXT;`;
        try {
            await sql`UPDATE tasks SET "taskdate" = "taskDate" WHERE "taskdate" IS NULL;`;
        } catch (e) {}

        console.log('Database verification complete.');
    } catch (e) {
        console.error('Migration Error:', e);
    }
    process.exit(0);
}
fix();
