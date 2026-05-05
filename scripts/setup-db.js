require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function setup() {
    try {
        console.log('Setting up database tables...');

        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                firstname TEXT,
                lastname TEXT,
                profilepic TEXT,
                role TEXT DEFAULT 'user'
            );
        `;

        try {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname TEXT;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname TEXT;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profilepic TEXT;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';`;
        } catch (err) {
            console.log('ALTER user table might have failed or columns already exist.');
        }

        await sql`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                userid TEXT,
                title TEXT,
                description TEXT,
                status TEXT,
                createdat TEXT,
                taskdate TEXT,
                FOREIGN KEY(userid) REFERENCES users(id)
            );
        `;

        try {
            await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS taskdate TEXT;`;
        } catch (err) {
            console.log('Column taskdate might already exist or ALTER not supported:', err.message);
        }


        console.log('Database tables created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

setup();
