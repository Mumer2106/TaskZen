require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function setup() {
    try {
        console.log('Setting up database tables...');

        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                userId TEXT,
                title TEXT,
                description TEXT,
                status TEXT,
                createdAt TEXT,
                FOREIGN KEY(userId) REFERENCES users(id)
            );
        `;

        console.log('Database tables created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

setup();
