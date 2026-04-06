const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function check() {
    try {
        const { rows } = await sql`SELECT id, username, length(password) as pass_len FROM users`;
        console.log('Users in DB:');
        console.table(rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
