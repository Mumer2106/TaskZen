/**
 * scripts/promote-admin.js
 *
 * Promotes a user to the 'admin' role in either the Postgres or JSON database.
 *
 * Usage:
 *   node scripts/promote-admin.js <email-or-user-id>
 *
 * Examples:
 *   node scripts/promote-admin.js user@example.com
 *   node scripts/promote-admin.js 1714500000000
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
    console.error('Usage: node scripts/promote-admin.js <email-or-user-id>');
    process.exit(1);
}

const DB_ADAPTER = process.env.DB_ADAPTER || (process.env.POSTGRES_URL ? 'postgres' : 'json');
console.log(`[promote-admin] Using adapter: ${DB_ADAPTER}`);

async function promotePostgres() {
    const { sql } = require('@vercel/postgres');

    // Try by username first, then by id
    let result = await sql`
        UPDATE users SET role = 'admin'
        WHERE LOWER(username) = ${target.toLowerCase()} OR id = ${target}
        RETURNING id, username, role
    `;

    if (result.rowCount === 0) {
        console.error(`[promote-admin] No user found matching "${target}".`);
        process.exit(1);
    }

    console.log(`[promote-admin] ✅ Promoted: ${result.rows[0].username} (${result.rows[0].id}) → role: ${result.rows[0].role}`);
    process.exit(0);
}

function promoteJson() {
    const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

    if (!fs.existsSync(DB_PATH)) {
        console.error(`[promote-admin] db.json not found at ${DB_PATH}`);
        process.exit(1);
    }

    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    const user = Object.values(db.users).find(
        u => u.username.toLowerCase() === target.toLowerCase() || u.id === target
    );

    if (!user) {
        console.error(`[promote-admin] No user found matching "${target}".`);
        console.log('Available users:');
        Object.values(db.users).forEach(u => console.log(`  - ${u.username} (id: ${u.id})`));
        process.exit(1);
    }

    db.users[user.id].role = 'admin';
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log(`[promote-admin] ✅ Promoted: ${user.username} (${user.id}) → role: admin`);
}

if (DB_ADAPTER === 'postgres') {
    promotePostgres().catch(err => {
        console.error('Postgres error:', err.message);
        process.exit(1);
    });
} else {
    promoteJson();
}
