import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'db.sqlite');

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        userId TEXT,
        title TEXT,
        description TEXT,
        status TEXT,
        createdAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
    );
`);

export async function findUser(username, password) {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    return user;
}

export async function createUser(username, password) {
    const id = Date.now().toString();
    try {
        db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(id, username, password);
        return { id, username };
    } catch (error) {
        if (error.message.toLowerCase().includes('unique constraint failed')) {
            throw new Error('User already exists');
        }
        throw error;
    }
}

export async function getTasksForUser(userId) {
    return db.prepare('SELECT * FROM tasks WHERE userId = ? ORDER BY id DESC').all(userId);
}

export async function saveTasksForUser(userId, tasks) {
    // This function is used to replace all tasks for a user
    // We'll use a transaction for consistency
    const deleteMany = db.prepare('DELETE FROM tasks WHERE userId = ?');
    const insertOne = db.prepare('INSERT INTO tasks (id, userId, title, description, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction((userId, tasks) => {
        deleteMany.run(userId);
        for (const task of tasks) {
            insertOne.run(task.id, userId, task.title, task.description, task.status, task.createdAt);
        }
    });

    transaction(userId, tasks);
}

export async function addTask(userId, task) {
    const insertOne = db.prepare('INSERT INTO tasks (id, userId, title, description, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
    insertOne.run(task.id, userId, task.title, task.description, task.status, task.createdAt);
}

export async function updateTask(userId, taskId, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);

    const query = `UPDATE tasks SET ${setClause} WHERE userId = ? AND id = ?`;
    db.prepare(query).run(...values, userId, taskId);
}

export async function deleteTasks(userId, taskIds) {
    if (taskIds.length === 0) return;
    const placeholders = taskIds.map(() => '?').join(',');
    const deleteMany = db.prepare(`DELETE FROM tasks WHERE userId = ? AND id IN (${placeholders})`);
    deleteMany.run(userId, ...taskIds);
}

// Admin Helpers
export async function getAllUsers() {
    return db.prepare('SELECT id, username FROM users ORDER BY id DESC').all();
}

export async function getAllTasks() {
    return db.prepare(`
        SELECT tasks.*, users.username as owner 
        FROM tasks 
        JOIN users ON tasks.userId = users.id 
        ORDER BY tasks.id DESC
    `).all();
}

export async function deleteUser(userId) {
    const deleteTasks = db.prepare('DELETE FROM tasks WHERE userId = ?');
    const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');

    const transaction = db.transaction((id) => {
        deleteTasks.run(id);
        deleteUser.run(id);
    });

    transaction(userId);
}

export async function deleteTaskAdmin(taskId) {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
}
