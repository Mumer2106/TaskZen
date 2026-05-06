/**
 * /api/user/tasks
 *
 * Dedicated endpoint for the User Dashboard — Task List panel.
 * All operations are scoped to the authenticated user's own tasks.
 *
 * GET   ?limit=5&offset=0&search=<query>
 *       Returns { tasks, total, hasMore }
 *
 * PATCH ?id=<taskId>
 *       Body: { status: 'Pending' | 'Completed' }
 *       Toggles status of a single task.
 *
 * DELETE ?id=<taskId>
 *        Deletes a single task.
 *        Pass ?id=BULK with body: { ids: [...] } for bulk delete.
 */

import { NextResponse } from 'next/server';
import { getTasksForUser, updateTask, deleteTask, deleteTasks } from '@/lib/db';
import { validateSession } from '@/lib/auth-server';

const DEFAULT_LIMIT = 5;

// ── GET — paginated task list ─────────────────────────────────────────────────
export async function GET(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const limit  = parseInt(searchParams.get('limit')  || String(DEFAULT_LIMIT), 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';

    try {
        const allTasks = await getTasksForUser(userId, search);
        const total    = allTasks.length;
        const tasks    = allTasks.slice(offset, offset + limit);
        const hasMore  = offset + limit < total;

        // Statistics for the overview panel
        const completed = allTasks.filter(t => t.status === 'Completed').length;
        const pending   = total - completed;

        return NextResponse.json({ tasks, total, hasMore, stats: { total, completed, pending } });
    } catch (error) {
        console.error('[/api/user/tasks GET]', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

// ── PATCH — toggle a single task's status ─────────────────────────────────────
export async function PATCH(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing task id' }, { status: 400 });

    try {
        const body = await request.json();
        await updateTask(userId, id, body);
        return NextResponse.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('[/api/user/tasks PATCH]', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

// ── DELETE — single or bulk task removal ──────────────────────────────────────
export async function DELETE(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id && id !== 'BULK') {
            // Single delete
            await deleteTasks(userId, [id]);
            return NextResponse.json({ message: 'Task deleted successfully' });
        }

        // Bulk delete — ids in request body
        const body = await request.json().catch(() => ({}));
        const ids  = Array.isArray(body.ids) ? body.ids : [];
        if (ids.length === 0) return NextResponse.json({ error: 'No task ids provided' }, { status: 400 });
        await deleteTasks(userId, ids);
        return NextResponse.json({ message: `${ids.length} task(s) deleted successfully` });
    } catch (error) {
        console.error('[/api/user/tasks DELETE]', error);
        return NextResponse.json({ error: 'Failed to delete task(s)' }, { status: 500 });
    }
}
