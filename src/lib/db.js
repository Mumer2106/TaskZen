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
    if (isPostgresConfigured) {
        const { rows } = await sql`SELECT * FROM users WHERE username = ${username} AND password = ${password}`;
        return rows[0] || null;
    } else {
        const db = await readJsonDb();
        return Object.values(db.users).find(u => u.username === username && u.password === password) || null;
    }
}

export async function createUser(username, password) {
    const id = Date.now().toString();
    if (isPostgresConfigured) {
        try {
            await sql`INSERT INTO users (id, username, password) VALUES (${id}, ${username}, ${password})`;
            return { id, username };
        } catch (error) {
            if (error.message.toLowerCase().includes('unique constraint failed') || error.message.toLowerCase().includes('duplicate key')) {
                throw new Error('User already exists');
            }
            throw error;
        }
    } else {
        const db = await readJsonDb();
        if (Object.values(db.users).some(u => u.username === username)) {
            throw new Error('User already exists');
        }
        const newUser = { id, username, password };
        db.users[id] = newUser;
        db.tasks[id] = [];
        await writeJsonDb(db);
        return newUser;
    }
}

export async function getTasksForUser(userId) {
    if (isPostgresConfigured) {
        const { rows } = await sql`SELECT * FROM tasks WHERE userId = ${userId} ORDER BY id DESC`;
        return rows;
    } else {
        const db = await readJsonDb();
        return db.tasks[userId] || [];
    }
}

export async function saveTasksForUser(userId, tasks) {
    if (isPostgresConfigured) {
        await sql`DELETE FROM tasks WHERE userId = ${userId}`;
        for (const task of tasks) {
            await sql`INSERT INTO tasks (id, userId, title, description, status, createdAt, taskDate) VALUES (${task.id}, ${userId}, ${task.title}, ${task.description}, ${task.status}, ${task.createdAt}, ${task.taskDate})`;
        }
    } else {
        const db = await readJsonDb();
        db.tasks[userId] = tasks;
        await writeJsonDb(db);
    }
}

export async function addTask(userId, task) {
    if (isPostgresConfigured) {
        await sql`INSERT INTO tasks (id, userId, title, description, status, createdAt, taskDate) VALUES (${task.id}, ${userId}, ${task.title}, ${task.description}, ${task.status}, ${task.createdAt}, ${task.taskDate})`;
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
        if (title !== undefined) await sql`UPDATE tasks SET title = ${title} WHERE userId = ${userId} AND id = ${taskId}`;
        if (description !== undefined) await sql`UPDATE tasks SET description = ${description} WHERE userId = ${userId} AND id = ${taskId}`;
        if (status !== undefined) await sql`UPDATE tasks SET status = ${status} WHERE userId = ${userId} AND id = ${taskId}`;
        if (taskDate !== undefined) await sql`UPDATE tasks SET taskDate = ${taskDate} WHERE userId = ${userId} AND id = ${taskId}`;
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
        await sql`DELETE FROM tasks WHERE userId = ${userId} AND id = ANY(${taskIds})`;
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
        const { rows } = await sql`SELECT id, username FROM users ORDER BY id DESC`;
        return rows;
    } else {
        const db = await readJsonDb();
        return Object.values(db.users).map(u => ({ id: u.id, username: u.username }));
    }
}

export async function getAllTasks() {
    if (isPostgresConfigured) {
        const { rows } = await sql`
            SELECT tasks.*, users.username as owner 
            FROM tasks 
            JOIN users ON tasks.userId = users.id 
            ORDER BY tasks.id DESC
        `;
        return rows;
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
        await sql`DELETE FROM tasks WHERE userId = ${userId}`;
        await sql`DELETE FROM users WHERE id = ${userId}`;
    } else {
        const db = await readJsonDb();
        delete db.users[userId];
        delete db.tasks[userId];
        await writeJsonDb(db);
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
