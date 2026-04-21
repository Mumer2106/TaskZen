import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

async function readJsonDb() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Ensure data directory exists if it doesn't
        try {
            await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        } catch (e) {}
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

// Explicitly choose adapter via environment variable, or fallback to auto-detection
const DB_ADAPTER = process.env.DB_ADAPTER || (process.env.POSTGRES_URL ? 'postgres' : 'json');
const isPostgresConfigured = DB_ADAPTER === 'postgres';

console.log(`[Database] Using adapter: ${DB_ADAPTER}`);

export async function findUser(username, password) {
    const normalizedUsername = username.toLowerCase();
    if (isPostgresConfigured) {
        try {
            const { rows } = await sql`
                SELECT id, username, firstname as "firstName", lastname as "lastName", profilepic as "profilePic" 
                FROM users 
                WHERE LOWER(username) = ${normalizedUsername} AND password = ${password}
            `;
            if (!rows[0]) return null;
            return {
                ...rows[0],
                firstName: rows[0].firstName || rows[0].firstname,
                lastName: rows[0].lastName || rows[0].lastname,
                profilePic: rows[0].profilePic || rows[0].profilepic,
                userId: rows[0].id // Fallback for userId if id is used
            };
        } catch (error) {
            console.error("Postgres findUser error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }

    } else {
        const db = await readJsonDb();
        return Object.values(db.users).find(u => u.username.toLowerCase() === normalizedUsername && u.password === password) || null;
    }
}

export async function findUserById(id) {
    if (isPostgresConfigured) {
        try {
            const { rows } = await sql`
                SELECT id, username, firstname as "firstName", lastname as "lastName", profilepic as "profilePic" 
                FROM users 
                WHERE id = ${id}
            `;
            if (!rows[0]) return null;
            return {
                ...rows[0],
                firstName: rows[0].firstName || rows[0].firstname,
                lastName: rows[0].lastName || rows[0].lastname,
                profilePic: rows[0].profilePic || rows[0].profilepic,
                userId: rows[0].id // Fallback for userId if id is used
            };
        } catch (error) {
            console.error("Postgres findUserById error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }

    } else {
        const db = await readJsonDb();
        return db.users[id] || null;
    }
}

export async function createUser(id, username, password, extraData = {}) {
    if (isPostgresConfigured) {
        try {
            const normalizedUsername = username.toLowerCase();
            const firstName = extraData?.firstName || '';
            const lastName = extraData?.lastName || '';
            const profilePic = extraData?.profilePic || null;
            
            // Use strictly lowercase column names to match standard Postgres folding
            await sql`
                INSERT INTO users (id, username, password, firstname, lastname, profilepic) 
                VALUES (${id}, ${normalizedUsername}, ${password}, ${firstName}, ${lastName}, ${profilePic})
            `;
            return { 
                id, 
                username: normalizedUsername, 
                firstName, 
                lastName, 
                profilePic,
                userId: id // Fallback
            };
        } catch (error) {

            const msg = error.message.toLowerCase();
            if (msg.includes('unique constraint') || msg.includes('duplicate key') || msg.includes('already exists')) {
                throw new Error('An account with this email already exists');
            }
            console.error("Postgres createUser error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
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
                userId: r.userId || r.userid
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

// Admin Helpers
export async function getAllUsers() {
    if (isPostgresConfigured) {
        try {
            const { rows } = await sql`SELECT id, username, firstname as "firstName", lastname as "lastName", profilepic as "profilePic" FROM users ORDER BY id DESC`;
            return rows.map(r => ({
                ...r,
                firstName: r.firstName || r.firstname,
                lastName: r.lastName || r.lastname,
                profilePic: r.profilePic || r.profilepic
            }));
        } catch (error) {
            console.error("Postgres getAllUsers error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }

    } else {
        const db = await readJsonDb();
        return Object.values(db.users).map(u => ({ id: u.id, username: u.username, firstName: u.firstName, lastName: u.lastName, profilePic: u.profilePic }));
    }
}

export async function getAllTasks() {
    if (isPostgresConfigured) {
        try {
            const { rows } = await sql`
                SELECT tasks.id, tasks.userid as "userId", tasks.title, tasks.description, tasks.status, tasks.createdat as "createdAt", tasks.taskdate as "taskDate", users.username as owner 
                FROM tasks 
                JOIN users ON tasks.userid = users.id 
                ORDER BY tasks.id DESC
            `;
            return rows.map(r => ({
                ...r,
                taskDate: r.taskDate || r.taskdate || 'Unscheduled',
                createdAt: r.createdAt || r.createdat,
                userId: r.userId || r.userid
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
        const { username, password, firstName, lastName, profilePic } = updates;
        try {
            if (username !== undefined) await sql`UPDATE users SET username = ${username.toLowerCase()} WHERE id = ${userId}`;
            if (password !== undefined) await sql`UPDATE users SET password = ${password} WHERE id = ${userId}`;
            if (firstName !== undefined) await sql`UPDATE users SET firstname = ${firstName} WHERE id = ${userId}`;
            if (lastName !== undefined) await sql`UPDATE users SET lastname = ${lastName} WHERE id = ${userId}`;
            if (profilePic !== undefined) await sql`UPDATE users SET profilepic = ${profilePic} WHERE id = ${userId}`;
            
            const { rows } = await sql`SELECT id, username, firstname as "firstName", lastname as "lastName", profilepic as "profilePic" FROM users WHERE id = ${userId}`;
            return rows[0];
        } catch (error) {
            console.error("Critical Postgres Update Error:", error.message);
            throw new Error(`Database Error: ${error.message}`);
        }
    } else {
        const db = await readJsonDb();
        if (db.users[userId]) {
            const filteredUpdates = {};
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    filteredUpdates[key] = updates[key];
                }
            });

            if (filteredUpdates.username) {
                const newUsername = filteredUpdates.username.toLowerCase();
                if (Object.values(db.users).some(u => u.id !== userId && u.username.toLowerCase() === newUsername)) {
                    throw new Error('This email is already in use by another account');
                }
                filteredUpdates.username = newUsername;
            }

            db.users[userId] = { ...db.users[userId], ...filteredUpdates };
            await writeJsonDb(db);
            return db.users[userId];
        }
        return null;
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

