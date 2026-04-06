const fs = require('fs/promises');
const path = require('path');

async function fix() {
    const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        const db = JSON.parse(data);
        console.log('Total users before fix:', Object.keys(db.users).length);
        
        let fixedCount = 0;
        let deletedCorrupted = 0;

        for (const id of Object.keys(db.users)) {
            const user = db.users[id];
            
            // Check for the "argument mismatch" corruption where id was email and username was password
            if (user.id.includes('@') && !user.password) {
                console.log('Corruption detected for id:', id);
                // This record has the email as ID and the password as username, but no password field.
                // It's better to remove it so they can register properly.
                delete db.users[id];
                deletedCorrupted++;
            }
            // Check for missing password in general
            else if (user.password === undefined || user.password === null) {
                console.log('Missing password for user:', user.username);
                // We don't know their password, so they must re-register
                delete db.users[id];
                deletedCorrupted++;
            }
        }

        console.log('Deleted corrupted records:', deletedCorrupted);
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Database cleaned. Users please re-register.');
    } catch (e) {
        console.error('Fix failed:', e);
    }
    process.exit(0);
}
fix();
