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
            const msg = error.message.toLowerCase();
            if (msg.includes('unique constraint') || msg.includes('duplicate key') || msg.includes('already exists')) {
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
        const queryParts = [];
        const values = [];

        if (title !== undefined) { queryParts.push(`title = $${values.length + 1}`); values.push(title); }
        if (description !== undefined) { queryParts.push(`description = $${values.length + 1}`); values.push(description); }
        if (status !== undefined) { queryParts.push(`status = $${values.length + 1}`); values.push(status); }
        if (taskDate !== undefined) { queryParts.push(`taskdate = $${values.length + 1}`); values.push(taskDate); }

        if (queryParts.length === 0) return;

        values.push(userId, taskId);
        const query = `UPDATE tasks SET ${queryParts.join(', ')} WHERE userid = $${values.length - 1} AND id = $${values.length}`;
        
        // Manual query execution for dynamic updates
        await sql.query(query, values);
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
