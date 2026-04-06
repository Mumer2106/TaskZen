const { findUser } = require('../src/lib/db');
require('dotenv').config({ path: '.env.local' });

async function test() {
    try {
        console.log('Testing findUser...');
        const user = await findUser('musheraz.123@gmail.com', 'some_password');
        console.log('User found:', user ? 'Yes' : 'No');
    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    }
    process.exit(0);
}
test();
