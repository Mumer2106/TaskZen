/**
 * /api/admin/tasks
 *
 * Dedicated API for the Admin Portal — Data Stream panel.
 *
 * GET ?secret=&limit=5&offset=0&userId=<id|optional>
 *      Returns { tasks, total, hasMore }
 *      When userId is supplied, filters tasks to that user only.
 *
 * PATCH ?secret=&id=<taskId>
 *      Body: { status: 'Pending' | 'Completed' }
 *      Toggles a single task's status.
 *
 * DELETE ?secret=&id=<taskId>
 *      Permanently removes a single task.
 */

import { NextResponse } from 'next/server';
import { getAllTasks, deleteTaskAdmin, updateTaskAdmin, findUserById } from '@/lib/db';
import { cookies } from 'next/headers';

// ── Shared admin auth guard ───────────────────────────────────────────────────
async function requireAdmin(request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret === 'KC@210639') {
        return { ok: true, source: 'key' };
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (userId) {
        const user = await findUserById(userId);
        if (user && (user.role || 'user') === 'admin') {
            return { ok: true, user, source: 'cookie' };
        }
    }

    return { ok: false, status: 401, error: 'Access Denied: Invalid Security Key or Session' };
}

// ── GET — paginated task list (optionally filtered by userId) ─────────────────
export async function GET(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const limit        = parseInt(searchParams.get('limit')  || '5', 10);
    const offset       = parseInt(searchParams.get('offset') || '0', 10);
    const filterUserId = searchParams.get('userId') || null;

    try {
        const allTasks = await getAllTasks();

        // Apply optional user filter
        const sourceTasks = filterUserId
            ? allTasks.filter(t => t.userId === filterUserId || t.createdBy === filterUserId)
            : allTasks;

        const total   = sourceTasks.length;
        const tasks   = sourceTasks.slice(offset, offset + limit);
        const hasMore = offset + limit < total;

        return NextResponse.json({ tasks, total, hasMore });
    } catch (error) {
        console.error('[/api/admin/tasks GET]', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

// ── PATCH — toggle a single task's status ─────────────────────────────────────
export async function PATCH(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing task id' }, { status: 400 });

    try {
        const body = await request.json();
        await updateTaskAdmin(id, body);
        return NextResponse.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('[/api/admin/tasks PATCH]', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

// ── DELETE — remove a single task ─────────────────────────────────────────────
export async function DELETE(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing task id' }, { status: 400 });

    try {
        await deleteTaskAdmin(id);
        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('[/api/admin/tasks DELETE]', error);
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
