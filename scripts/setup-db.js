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
                firstName TEXT,
                lastName TEXT,
                profilePic TEXT
            );
        `;

        try {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstName TEXT;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastName TEXT;`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profilePic TEXT;`;
        } catch (err) {
            console.log('ALTER user table might have failed or columns already exist.');
        }

        await sql`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                userId TEXT,
                title TEXT,
                description TEXT,
                status TEXT,
                createdAt TEXT,
                taskDate TEXT,
                FOREIGN KEY(userId) REFERENCES users(id)
            );
        `;

        try {
            await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS taskDate TEXT;`;
        } catch (err) {
            console.log('Column taskDate might already exist or ALTER not supported:', err.message);
        }

        console.log('Database tables created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

setup();
