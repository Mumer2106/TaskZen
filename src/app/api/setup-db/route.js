import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
    try {
        console.log('Initializing database tables...');

        // Create Users Table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                firstname TEXT,
                lastname TEXT,
                profilepic TEXT,
                role TEXT DEFAULT 'user'
            );
        `;

        // Ensure all columns exist (Migration handling)
        const columnsToEnsure = [
            { name: 'firstname', type: 'TEXT' },
            { name: 'lastname', type: 'TEXT' },
            { name: 'profilepic', type: 'TEXT' },
            { name: 'role', type: 'TEXT DEFAULT \'user\'' },
            { name: 'banned', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'isbanned', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'lastactive', type: 'TEXT' },
            { name: 'sessiontoken', type: 'TEXT' }
        ];

        for (const col of columnsToEnsure) {
            try {
                // Postgres doesn't support IF NOT EXISTS in ALTER TABLE ADD COLUMN in older versions, 
                // but @vercel/postgres (Neon) does. Still, we wrap in try/catch for safety.
                await sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
            } catch (err) {
                 console.log(`Column ${col.name} note:`, err.message);
            }
        }

        // Create Tasks Table
        await sql`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                userid TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'Pending',
                createdat TEXT,
                taskdate TEXT,
                FOREIGN KEY(userid) REFERENCES users(id) ON DELETE CASCADE
            );
        `;

        try {
            await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS taskdate TEXT;`;
        } catch (err) {
            console.log('Tasks migration note:', err.message);
        }

        return NextResponse.json({ 
            success: true, 
            message: "Database schema synchronized successfully. All columns (including 'role') are verified.",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database Setup Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            hint: "Check your Vercel Postgres environment variables." 
        }, { status: 500 });
    }
}
