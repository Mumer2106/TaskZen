import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

async function readJsonDb() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: {}, tasks: {} };
    }
}

async function writeJsonDb(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

const isPostgresConfigured = !!process.env.POSTGRES_URL;

export async function findUser(username, password) {
    const normalizedUsername = username.toLowerCase();
    if (isPostgresConfigured) {
        const { rows } = await sql`SELECT id, username, firstname as "firstName", lastname as "lastName", profilepic as "profilePic" FROM users WHERE LOWER(username) = ${normalizedUsername} AND password = ${password}`;
        return rows[0] || null;
    } else {
        const db = await readJsonDb();
        return Object.values(db.users).find(u => u.username.toLowerCase() === normalizedUsername && u.password === password) || null;
    }
}

export async function createUser(id, username, password, extraData = {}) {
    if (isPostgresConfigured) {
        try {
            const normalizedUsername = username.toLowerCase();
            const firstName = extraData?.firstName || '';
            const lastName = extraData?.lastName || '';
            const profilePic = extraData?.profilePic || null;
            await sql`INSERT INTO users (id, username, password, firstName, lastName, profilePic) VALUES (${id}, ${normalizedUsername}, ${password}, ${firstName}, ${lastName}, ${profilePic})`;
            return { id, username: normalizedUsername, firstName, lastName, profilePic };
        } catch (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('unique constraint') || msg.includes('duplicate key') || msg.includes('already exists')) {
                throw new Error('An account with this email already exists');
            }
            throw error;
        }
    } else {
        const db = await readJsonDb();
        const normalizedUsername = username.toLowerCase();
        if (Object.values(db.users).some(u => u.username.toLowerCase() === normalizedUsername)) {
            throw new Error('An account with this email already exists');
        }
        if (!password) throw new Error('System: Critical password mismatch in creation');
        const newUser = { 
            id: id, 
            username: normalizedUsername, 
            password: password,
            firstName: extraData?.firstName || '',
            lastName: extraData?.lastName || '',
            profilePic: extraData?.profilePic || null
        };
        db.users[id] = newUser;
        if (!db.tasks[id]) db.tasks[id] = [];
        await writeJsonDb(db);
        return newUser;
    }
}

export async function getTasksForUser(userId) {
    if (isPostgresConfigured) {
        const { rows } = await sql`
            SELECT id, userid as "userId", title, description, status, createdat as "createdAt", taskdate as "taskDate" 
            FROM tasks WHERE userid = ${userId} ORDER BY id DESC
        `;
        return rows;
    } else {
        const db = await readJsonDb();
        return db.tasks[userId] || [];
    }
}

export async function saveTasksForUser(userId, tasks) {
    if (isPostgresConfigured) {
        await sql`DELETE FROM tasks WHERE userid = ${userId}`;
        for (const task of tasks) {
            await sql`
                INSERT INTO tasks (id, userid, title, description, status, createdat, taskdate) 
                VALUES (${task.id}, ${userId}, ${task.title}, ${task.description}, ${task.status}, ${task.createdAt}, ${task.taskDate})
            `;
        }
    } else {
        const db = await readJsonDb();
        db.tasks[userId] = tasks;
        await writeJsonDb(db);
    }
}

export async function addTask(userId, task) {
    if (isPostgresConfigured) {
        await sql`
            INSERT INTO tasks (id, userid, title, description, status, createdat, taskdate) 
            VALUES (${task.id}, ${userId}, ${task.title}, ${task.description}, ${task.status}, ${task.createdAt}, ${task.taskDate})
        `;
    } else {
        const db = await readJsonDb();
        if (!db.tasks[userId]) db.tasks[userId] = [];
        db.tasks[userId].unshift(task);
        await writeJsonDb(db);
    }
}

export async function updateTask(userId, taskId, updates) {
    if (isPostgresConfigured) {
        const { title, description, status, taskDate } = updates;
        
        if (title !== undefined) await sql`UPDATE tasks SET title = ${title} WHERE userid = ${userId} AND id = ${taskId}`;
        if (description !== undefined) await sql`UPDATE tasks SET description = ${description} WHERE userid = ${userId} AND id = ${taskId}`;
        if (status !== undefined) await sql`UPDATE tasks SET status = ${status} WHERE userid = ${userId} AND id = ${taskId}`;
        if (taskDate !== undefined) await sql`UPDATE tasks SET taskdate = ${taskDate} WHERE userid = ${userId} AND id = ${taskId}`;
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
        if (taskIds.length === 0) return;
        await sql`DELETE FROM tasks WHERE userid = ${userId} AND id = ANY(${taskIds})`;
    } else {
        const db = await readJsonDb();
        if (db.tasks[userId]) {
            db.tasks[userId] = db.tasks[userId].filter(t => !taskIds.includes(t.id));
            await writeJsonDb(db);
        }
    }
}

// Admin Helpers
export async function getAllUsers() {
    if (isPostgresConfigured) {
        const { rows } = await sql`SELECT id, username, firstname as "firstName", lastname as "lastName", profilepic as "profilePic" FROM users ORDER BY id DESC`;
        return rows;
    } else {
        const db = await readJsonDb();
        return Object.values(db.users).map(u => ({ id: u.id, username: u.username, firstName: u.firstName, lastName: u.lastName, profilePic: u.profilePic }));
    }
}

export async function getAllTasks() {
    if (isPostgresConfigured) {
        const { rows } = await sql`
            SELECT tasks.*, users.username as owner 
            FROM tasks 
            JOIN users ON tasks.userid = users.id 
            ORDER BY tasks.id DESC
        `;
        return rows.map(r => ({
            ...r,
            taskDate: r.taskDate || r.taskdate || 'Unscheduled', // Handle case-insensitivity
            createdAt: r.createdAt || r.createdat
        }));
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
        await sql`DELETE FROM tasks WHERE userid = ${userId}`;
        await sql`DELETE FROM users WHERE id = ${userId}`;
    } else {
        const db = await readJsonDb();
        delete db.users[userId];
        delete db.tasks[userId];
        await writeJsonDb(db);
    }
}

export async function updateUser(userId, updates) {
    if (isPostgresConfigured) {
        const { username, password, firstName, lastName, profilePic } = updates;
        
        if (username !== undefined) await sql`UPDATE users SET username = ${username.toLowerCase()} WHERE id = ${userId}`;
        if (password !== undefined) await sql`UPDATE users SET password = ${password} WHERE id = ${userId}`;
        if (firstName !== undefined) await sql`UPDATE users SET firstname = ${firstName} WHERE id = ${userId}`;
        if (lastName !== undefined) await sql`UPDATE users SET lastname = ${lastName} WHERE id = ${userId}`;
        if (profilePic !== undefined) await sql`UPDATE users SET profilepic = ${profilePic} WHERE id = ${userId}`;
        
        const { rows } = await sql`SELECT id, username, firstname as "firstName", lastname as "lastName", profilepic as "profilePic" FROM users WHERE id = ${userId}`;
        return rows[0];
    } else {
        const db = await readJsonDb();
        if (db.users[userId]) {
            if (updates.username) updates.username = updates.username.toLowerCase();
            db.users[userId] = { ...db.users[userId], ...updates };
            await writeJsonDb(db);
            return db.users[userId];
        }
        return null;
    }
}

export async function deleteTaskAdmin(taskId) {
    if (isPostgresConfigured) {
        await sql`DELETE FROM tasks WHERE id = ${taskId}`;
    } else {
        const db = await readJsonDb();
        for (const userId in db.tasks) {
            db.tasks[userId] = db.tasks[userId].filter(t => t.id !== taskId);
        }
        await writeJsonDb(db);
    }
}
