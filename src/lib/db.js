import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export function generateId() {
    return crypto.randomUUID();
}

async function readJsonDb() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        try {
            await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        } catch (e) { }
        return { users: {}, tasks: {} };
    }
}

async function writeJsonDb(data) {
    try {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Critical JSON DB Write Error:", error);
        throw new Error("System: Failed to save data locally.");
    }
}

// Strips password and normalizes field names
function normalizeUser(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return {
        ...safe,
        id: user.id || user.userId || '',
        userId: user.id || user.userId || '',
        username: user.username || '',
        firstName: user.firstName || user.firstname || '',
        lastName: user.lastName || user.lastname || '',
        profilePic: user.profilePic || user.profilepic || null,
        role: user.role || 'user',
        isBanned: !!user.isbanned || !!user.isBanned || !!user.banned,
        lastActive: user.lastActive || user.lastactive || null,
    };
}

// Legacy alias for sanitizeUser if needed, but we'll use normalizeUser internally
function sanitizeUser(user) {
    return normalizeUser(user);
}

const DB_ADAPTER = process.env.DB_ADAPTER || (process.env.POSTGRES_URL ? 'postgres' : 'json');
const isPostgresConfigured = DB_ADAPTER === 'postgres';

console.log(`[Database] Using adapter: ${DB_ADAPTER}`);

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export async function findUser(username, password) {
    const normalizedUsername = username.toLowerCase().trim();

    if (isPostgresConfigured) {
        try {
            const { rows } = await sql`
                SELECT * FROM users 
                WHERE LOWER(username) = ${normalizedUsername}
            `;
            const user = rows[0];
            if (!user) return null;

            const isMatch = await verifyPassword(password, user.password);
            if (!isMatch) return null;

            return normalizeUser({
                ...user,
                userId: user.id,
            });
        } catch (error) {
            console.error("Postgres findUser error:", error.message);
            throw new Error(`Database Error: ${error.message}. Hint: Try visiting /api/setup-db to sync your schema.`);
        }
    } else {
        const db = await readJsonDb();
        const user = Object.values(db.users).find(
            u => u.username.toLowerCase() === normalizedUsername
        );
        if (!user) return null;

        const isMatch = await verifyPassword(password, user.password);
        if (!isMatch) return null;

        // Ensure sessionToken exists
        if (!user.sessionToken) {
            user.sessionToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
            db.users[user.id].sessionToken = user.sessionToken;
            await writeJsonDb(db);
        }

        return normalizeUser({
            ...user,
            isBanned: !!user.banned,
            sessionToken: user.sessionToken
        });
    }
}

export async function findUserById(id) {
    if (isPostgresConfigured) {
        try {
            const { rows } = await sql`
                SELECT * FROM users 
                WHERE id = ${id}
            `;
            if (!rows[0]) return null;
            const r = rows[0];
            return normalizeUser({
                ...r,
                userId: r.id,
            });
        } catch (error) {
            console.error("Postgres findUserById error:", error.message);
            throw new Error(`Database Error: ${error.message}. Hint: Try visiting /api/setup-db to sync your schema.`);
        }
    } else {
        const db = await readJsonDb();
        const user = db.users[id];
        if (!user) return null;
        return normalizeUser(user);
    }
}

export async function createUser(id, username, password, extraData = {}) {
    const hashedPassword = await bcrypt.hash(password, 12);

    if (isPostgresConfigured) {
        try {
            const normalizedUsername = username.toLowerCase().trim();
            const firstName = extraData?.firstName || '';
            const lastName = extraData?.lastName || '';
            const profilePic = extraData?.profilePic || null;

            // We don't include 'role' in the INSERT to maintain compatibility 
            // with older database schemas that lack the 'role' column. 
            // If the column exists, it will use the DEFAULT 'user'.
            await sql`
                INSERT INTO users (id, username, password, firstname, lastname, profilepic) 
                VALUES (${id}, ${normalizedUsername}, ${hashedPassword}, ${firstName}, ${lastName}, ${profilePic})
            `;

            return normalizeUser({
                id,
                username: normalizedUsername,
                firstName,
                lastName,
                profilePic,
                role: 'user', // Default to user in the response
                userId: id,
            });
        } catch (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('unique constraint') || msg.includes('duplicate key') || msg.includes('already exists')) {
                throw new Error('An account with this email already exists');
            }
            console.error("Postgres createUser error:", error.message);
            throw new Error(`Database Error: ${error.message}. Hint: Visit /api/setup-db to fix your schema.`);
        }
    } else {
        const db = await readJsonDb();
        const normalizedUsername = username.toLowerCase().trim();
        if (Object.values(db.users).some(u => u.username.toLowerCase() === normalizedUsername)) {
            throw new Error('An account with this email already exists');
        }
        const newUser = {
            id,
            username: normalizedUsername,
            password: hashedPassword,
            firstName: extraData?.firstName || '',
            lastName: extraData?.lastName || '',
            profilePic: extraData?.profilePic || null,
            role: extraData?.role || 'user',
            sessionToken: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
        };
        db.users[id] = newUser;
        if (!db.tasks[id]) db.tasks[id] = [];
        await writeJsonDb(db);
        return normalizeUser(newUser);
    }
}

// ─── Password Verification (handles both bcrypt and legacy plaintext) ─────────

async function verifyPassword(plain, stored) {
    if (!stored) return false;
    if (stored.startsWith('$2')) {
        return bcrypt.compare(plain, stored);
    }
    // Legacy plaintext — accept but caller should migrate
    return plain === stored;
}

// ─── Task Functions ───────────────────────────────────────────────────────────

export async function getTasksForUser(userId, search = '') {
    if (isPostgresConfigured) {
        try {
            let rows;
            if (search) {
                const searchTerm = `%${search.toLowerCase()}%`;
                const result = await sql`
                    SELECT id, userid as "userId", title, description, status, createdat as "createdAt", taskdate as "taskDate" 
                    FROM tasks 
                    WHERE userid = ${userId} AND (LOWER(title) LIKE ${searchTerm} OR LOWER(description) LIKE ${searchTerm})
                    ORDER BY id DESC
                `;
                rows = result.rows;
            } else {
                const result = await sql`
                    SELECT id, userid as "userId", title, description, status, createdat as "createdAt", taskdate as "taskDate" 
                    FROM tasks WHERE userid = ${userId} ORDER BY id DESC
                `;
                rows = result.rows;
            }
            return rows.map(r => ({
                ...r,
                taskDate: r.taskDate || r.taskdate || 'Unscheduled',
                createdAt: r.createdAt || r.createdat,
                userId: r.userId || r.userid,
            }));
        } catch (error) {
            console.error("Postgres getTasksForUser error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        let tasks = db.tasks[userId] || [];
        if (search) {
            const query = search.toLowerCase();
            tasks = tasks.filter(t =>
                (t.title && t.title.toLowerCase().includes(query)) ||
                (t.description && t.description.toLowerCase().includes(query))
            );
        }
        return tasks;
    }
}

export async function saveTasksForUser(userId, tasks) {
    if (isPostgresConfigured) {
        try {
            await sql`DELETE FROM tasks WHERE userid = ${userId}`;
            for (const task of tasks) {
                await sql`
                    INSERT INTO tasks (id, userid, title, description, status, createdat, taskdate) 
                    VALUES (${task.id}, ${userId}, ${task.title}, ${task.description}, ${task.status}, ${task.createdAt}, ${task.taskDate})
                `;
            }
        } catch (error) {
            console.error("Postgres saveTasksForUser error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        db.tasks[userId] = tasks;
        await writeJsonDb(db);
    }
}

export async function addTask(userId, task) {
    if (isPostgresConfigured) {
        try {
            await sql`
                INSERT INTO tasks (id, userid, title, description, status, createdat, taskdate) 
                VALUES (${task.id}, ${userId}, ${task.title}, ${task.description}, ${task.status}, ${task.createdAt}, ${task.taskDate})
            `;
        } catch (error) {
            console.error("Postgres addTask error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        if (!db.tasks[userId]) db.tasks[userId] = [];
        db.tasks[userId].unshift(task);
        await writeJsonDb(db);
    }
}

export async function updateTask(userId, taskId, updates) {
    if (isPostgresConfigured) {
        try {
            const { title, description, status, taskDate } = updates;
            if (title !== undefined) await sql`UPDATE tasks SET title = ${title} WHERE userid = ${userId} AND id = ${taskId}`;
            if (description !== undefined) await sql`UPDATE tasks SET description = ${description} WHERE userid = ${userId} AND id = ${taskId}`;
            if (status !== undefined) await sql`UPDATE tasks SET status = ${status} WHERE userid = ${userId} AND id = ${taskId}`;
            if (taskDate !== undefined) await sql`UPDATE tasks SET taskdate = ${taskDate} WHERE userid = ${userId} AND id = ${taskId}`;
        } catch (error) {
            console.error("Postgres updateTask error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        const userTasks = db.tasks[userId] || [];
        const taskIndex = userTasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            userTasks[taskIndex] = { ...userTasks[taskIndex], ...updates };
            await writeJsonDb(db);
        }
    }
}

export async function deleteTasks(userId, taskIds) {
    if (isPostgresConfigured) {
        try {
            if (taskIds.length === 0) return;
            await sql`DELETE FROM tasks WHERE userid = ${userId} AND id = ANY(${taskIds})`;
        } catch (error) {
            console.error("Postgres deleteTasks error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        if (db.tasks[userId]) {
            db.tasks[userId] = db.tasks[userId].filter(t => !taskIds.includes(t.id));
            await writeJsonDb(db);
        }
    }
}

// ─── Admin Helpers ────────────────────────────────────────────────────────────

export async function getAllUsers() {
    if (isPostgresConfigured) {
        try {
            const { rows } = await sql`SELECT * FROM users ORDER BY id DESC`;
            return rows.map(r => ({
                ...r,
                firstName: r.firstName || r.firstname || '',
                lastName: r.lastName || r.lastname || '',
                profilePic: r.profilePic || r.profilepic || null,
                role: r.role || 'user',
                isBanned: !!r.isbanned || !!r.banned,
                lastActive: r.lastActive || r.lastactive || null,
            }));
        } catch (error) {
            console.error("Postgres getAllUsers error:", error.message);
            throw new Error(`Database Error: ${error.message}. Hint: Visit /api/setup-db to fix your schema.`);
        }
    } else {
        const db = await readJsonDb();
        return Object.values(db.users).map(u => ({
            id: u.id,
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            profilePic: u.profilePic,
            role: u.role || 'user',
            isBanned: !!u.banned,
            lastActive: u.lastActive || null,
        }));
    }
}

export async function touchUserActivity(userId) {
    const now = new Date().toISOString();
    if (isPostgresConfigured) {
        try {
            await sql`UPDATE users SET lastactive = ${now} WHERE id = ${userId}`;
        } catch (e) { /* ignore table not setup yet */ }
    } else {
        const db = await readJsonDb();
        if (db.users[userId]) {
            db.users[userId].lastActive = now;
            await writeJsonDb(db);
        }
    }
}

export async function clearUserActivity(userId) {
    const wayBack = new Date(0).toISOString(); // Epoch 1970
    if (isPostgresConfigured) {
        try {
            await sql`UPDATE users SET lastactive = ${wayBack} WHERE id = ${userId}`;
        } catch (e) { }
    } else {
        const db = await readJsonDb();
        if (db.users[userId]) {
            db.users[userId].lastActive = wayBack;
            await writeJsonDb(db);
        }
    }
}


export async function getAllTasks() {
    if (isPostgresConfigured) {
        try {
            const { rows } = await sql`
                SELECT tasks.id, tasks.userid as "userId", tasks.title, tasks.description,
                       tasks.status, tasks.createdat as "createdAt", tasks.taskdate as "taskDate",
                       users.username as owner 
                FROM tasks 
                JOIN users ON tasks.userid = users.id 
                ORDER BY tasks.id DESC
            `;
            return rows.map(r => ({
                ...r,
                taskDate: r.taskDate || r.taskdate || 'Unscheduled',
                createdAt: r.createdAt || r.createdat,
                userId: r.userId || r.userid,
            }));
        } catch (error) {
            console.error("Postgres getAllTasks error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        const allTasks = [];
        for (const [userId, userTasks] of Object.entries(db.tasks)) {
            const username = db.users[userId]?.username || 'Unknown';
            allTasks.push(...userTasks.map(t => ({ ...t, owner: username, userId })));
        }
        return allTasks.sort((a, b) => b.id.localeCompare(a.id));
    }
}

export async function deleteUser(userId) {
    if (isPostgresConfigured) {
        try {
            await sql`DELETE FROM tasks WHERE userid = ${userId}`;
            await sql`DELETE FROM users WHERE id = ${userId}`;
        } catch (error) {
            console.error("Postgres deleteUser error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        delete db.users[userId];
        delete db.tasks[userId];
        await writeJsonDb(db);
    }
}

export async function updateUser(userId, updates) {
    if (isPostgresConfigured) {
        const { username, password, firstName, lastName, profilePic, role } = updates;
        try {
            if (username !== undefined) await sql`UPDATE users SET username = ${username.toLowerCase()} WHERE id = ${userId}`;
            if (password !== undefined) {
                const hashed = await bcrypt.hash(password, 12);
                await sql`UPDATE users SET password = ${hashed} WHERE id = ${userId}`;

                // Regenerate session token on password change to force logout all sessions
                const newToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
                try {
                    await sql`UPDATE users SET sessiontoken = ${newToken} WHERE id = ${userId}`;
                } catch (e) {
                    console.warn("Session token column missing, skipping update.");
                }
            }
            if (firstName !== undefined) await sql`UPDATE users SET firstname = ${firstName} WHERE id = ${userId}`;
            if (lastName !== undefined) await sql`UPDATE users SET lastname = ${lastName} WHERE id = ${userId}`;
            if (profilePic !== undefined) await sql`UPDATE users SET profilepic = ${profilePic} WHERE id = ${userId}`;

            if (role !== undefined) {
                try {
                    await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
                } catch (e) {
                    console.warn("Failed to update role:", e.message);
                }
            }

            const { rows } = await sql`SELECT * FROM users WHERE id = ${userId}`;
            const updated = rows[0];

            return updated ? normalizeUser({
                ...updated,
                userId: updated.id,
            }) : null;
        } catch (error) {
            console.error("Critical Postgres Update Error:", error.message);
            throw new Error(`Database Error: ${error.message}. Hint: Visit /api/setup-db to fix your schema.`);
        }
    } else {
        const db = await readJsonDb();
        if (!db.users[userId]) return null;

        const filteredUpdates = {};
        for (const [key, val] of Object.entries(updates)) {
            if (val !== undefined) filteredUpdates[key] = val;
        }

        if (filteredUpdates.username) {
            const newUsername = filteredUpdates.username.toLowerCase();
            if (Object.values(db.users).some(u => u.id !== userId && u.username.toLowerCase() === newUsername)) {
                throw new Error('This email is already in use by another account');
            }
            filteredUpdates.username = newUsername;
        }

        // Hash new password if provided
        if (filteredUpdates.password) {
            filteredUpdates.password = await bcrypt.hash(filteredUpdates.password, 12);
            filteredUpdates.sessionToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        }

        db.users[userId] = { ...db.users[userId], ...filteredUpdates };
        await writeJsonDb(db);
        return normalizeUser(db.users[userId]);
    }
}

export async function promoteUserToAdmin(userId) {
    if (isPostgresConfigured) {
        await sql`UPDATE users SET role = 'admin' WHERE id = ${userId}`;
    } else {
        const db = await readJsonDb();
        if (!db.users[userId]) throw new Error(`User ${userId} not found`);
        db.users[userId].role = 'admin';
        await writeJsonDb(db);
    }
}

export async function deleteTaskAdmin(taskId) {
    if (isPostgresConfigured) {
        try {
            await sql`DELETE FROM tasks WHERE id = ${taskId}`;
        } catch (error) {
            console.error("Postgres deleteTaskAdmin error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        for (const userId in db.tasks) {
            db.tasks[userId] = db.tasks[userId].filter(t => t.id !== taskId);
        }
        await writeJsonDb(db);
    }
}

export async function updateTaskAdmin(taskId, updates) {
    if (isPostgresConfigured) {
        try {
            const { status } = updates;
            if (status !== undefined) await sql`UPDATE tasks SET status = ${status} WHERE id = ${taskId}`;
        } catch (error) {
            console.error("Postgres updateTaskAdmin error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        for (const userId in db.tasks) {
            const taskIndex = db.tasks[userId].findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                db.tasks[userId][taskIndex] = { ...db.tasks[userId][taskIndex], ...updates };
                await writeJsonDb(db);
                break;
            }
        }
    }
}
