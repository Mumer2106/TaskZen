import { sql } from '@vercel/postgres';

export async function findUser(username, password) {
    const { rows } = await sql`SELECT * FROM users WHERE username = ${username} AND password = ${password}`;
    return rows[0] || null;
}

export async function createUser(username, password) {
    const id = Date.now().toString();
    try {
        await sql`INSERT INTO users (id, username, password) VALUES (${id}, ${username}, ${password})`;
        return { id, username };
    } catch (error) {
        if (error.message.toLowerCase().includes('unique constraint failed') || error.message.toLowerCase().includes('duplicate key')) {
            throw new Error('User already exists');
        }
        throw error;
    }
}

export async function getTasksForUser(userId) {
    const { rows } = await sql`SELECT * FROM tasks WHERE userId = ${userId} ORDER BY id DESC`;
    return rows;
}

export async function saveTasksForUser(userId, tasks) {
    // Note: Transaction management with Vercel Postgres literal can be tricky,
    // but here we can just delete and then insert.
    // However, it's safer to use the transaction if possible.
    // For now, let's keep it simple as it was in SQLite but async.

    await sql`DELETE FROM tasks WHERE userId = ${userId}`;

    for (const task of tasks) {
        await sql`INSERT INTO tasks (id, userId, title, description, status, createdAt) VALUES (${task.id}, ${userId}, ${task.title}, ${task.description}, ${task.status}, ${task.createdAt})`;
    }
}

export async function addTask(userId, task) {
    await sql`INSERT INTO tasks (id, userId, title, description, status, createdAt) VALUES (${task.id}, ${userId}, ${task.title}, ${task.description}, ${task.status}, ${task.createdAt})`;
}

export async function updateTask(userId, taskId, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    // Postgres update with dynamic fields is slightly different in pg.
    // But since we have few fields, we can do it explicitly or use a builder.
    // Let's do it explicitly for common fields: title, description, status
    const { title, description, status } = updates;

    if (title !== undefined && description !== undefined && status !== undefined) {
        await sql`UPDATE tasks SET title = ${title}, description = ${description}, status = ${status} WHERE userId = ${userId} AND id = ${taskId}`;
    } else if (title !== undefined) {
        await sql`UPDATE tasks SET title = ${title} WHERE userId = ${userId} AND id = ${taskId}`;
    } else if (description !== undefined) {
        await sql`UPDATE tasks SET description = ${description} WHERE userId = ${userId} AND id = ${taskId}`;
    } else if (status !== undefined) {
        await sql`UPDATE tasks SET status = ${status} WHERE userId = ${userId} AND id = ${taskId}`;
    }
}

export async function deleteTasks(userId, taskIds) {
    if (taskIds.length === 0) return;
    // IN operator with multiple values in Vercel Postgres:
    // We can use a trick with ANY or build it dynamically.
    // For multiple IDs, ANY is cleaner.
    await sql`DELETE FROM tasks WHERE userId = ${userId} AND id = ANY(${taskIds})`;
}

// Admin Helpers
export async function getAllUsers() {
    const { rows } = await sql`SELECT id, username FROM users ORDER BY id DESC`;
    return rows;
}

export async function getAllTasks() {
    const { rows } = await sql`
        SELECT tasks.*, users.username as owner 
        FROM tasks 
        JOIN users ON tasks.userId = users.id 
        ORDER BY tasks.id DESC
    `;
    return rows;
}

export async function deleteUser(userId) {
    // Delete tasks first then user
    await sql`DELETE FROM tasks WHERE userId = ${userId}`;
    await sql`DELETE FROM users WHERE id = ${userId}`;
}

export async function deleteTaskAdmin(taskId) {
    await sql`DELETE FROM tasks WHERE id = ${taskId}`;
}
