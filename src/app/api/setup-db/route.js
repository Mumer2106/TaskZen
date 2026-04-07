// import { NextResponse } from 'next/server';
// import { sql } from '@vercel/postgres';

// export async function GET() {
//     try {
//         console.log('Initializing database tables from browser...');

//         // Create Users Table
//         await sql`
//             CREATE TABLE IF NOT EXISTS users (
//                 id TEXT PRIMARY KEY,
//                 username TEXT UNIQUE,
//                 password TEXT,
//                 firstname TEXT,
//                 lastname TEXT,
//                 profilepic TEXT
//             );
//         `;

//         // Check and add missing columns if they don't exist
//         try {
//             await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname TEXT;`;
//             await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname TEXT;`;
//             await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profilepic TEXT;`;
//         } catch (err) {
//              console.log('Columns might already exist');
//         }

//         // Create Tasks Table
//         await sql`
//             CREATE TABLE IF NOT EXISTS tasks (
//                 id TEXT PRIMARY KEY,
//                 userid TEXT,
//                 title TEXT,
//                 description TEXT,
//                 status TEXT,
//                 createdat TEXT,
//                 taskdate TEXT,
//                 FOREIGN KEY(userid) REFERENCES users(id)
//             );
//         `;

//         try {
//             await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS taskdate TEXT;`;
//         } catch (err) {
//             console.log('Task column might already exist');
//         }

//         return NextResponse.json({ 
//             success: true, 
//             message: "Database schema initialized successfully.",
//             timestamp: new Date().toISOString()
//         });
//     } catch (error) {
//         console.error('Database Setup Error:', error);
//         return NextResponse.json({ 
//             success: false, 
//             error: error.message,
//             hint: "Ensure POSTGRES_URL is correctly set in your environment variables." 
//         }, { status: 500 });
//     }
// }
