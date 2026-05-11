/**
 * /api/admin/data
 *
 * Stats-only endpoint — used on initial portal load to hydrate
 * the four stat cards (Total Users, Data Pipeline, Pending, Completed).
 *
 * User Registry rows → /api/admin/users
 * Data Stream rows   → /api/admin/tasks
 *
 * GET    ?secret=   → { stats }
 * PATCH  ?secret=&id=<taskId>&type=task  → toggle task status   (legacy compat)
 * DELETE ?secret=&id=<id>&type=user|task → delete user or task  (legacy compat)
 */

import { NextResponse } from 'next/server';
import { getAllUsers, getAllTasks, deleteUser, deleteTaskAdmin, updateTaskAdmin, findUserById } from '@/lib/db';
import { cookies } from 'next/headers';

// ── Admin auth guard ──────────────────────────────────────────────────────────
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

// ── GET — stats block only ────────────────────────────────────────────────────
export async function GET(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const [allUsers, allTasks] = await Promise.all([getAllUsers(), getAllTasks()]);

        // Extract top active users for the dashboard (regardless of pagination)
        const recentActiveUsers = [...allUsers]
            .filter(u => u.lastActive)
            .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
            .slice(0, 5)
            .map(u => ({
                id: u.id,
                username: u.username,
                firstName: u.firstName || u.firstname || '',
                lastName: u.lastName || u.lastname || '',
                lastActive: u.lastActive,
            }));

        return NextResponse.json({
            stats: {
                totalUsers:     allUsers.length,
                totalTasks:     allTasks.length,
                pendingTasks:   allTasks.filter(t => t.status === 'Pending').length,
                completedTasks: allTasks.filter(t => t.status === 'Completed').length,
                recentActiveUsers,
            },
        });
    } catch (error) {
        console.error('[/api/admin/data GET]', error);
        return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }
}

// ── PATCH — toggle task status (kept for compatibility) ───────────────────────
export async function PATCH(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const id   = searchParams.get('id');
    const type = searchParams.get('type');
    if (!id || !type) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    try {
        const body = await request.json();
        if (type === 'task') {
            await updateTaskAdmin(id, body);
        } else {
            return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('[/api/admin/data PATCH]', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

// ── DELETE — remove user or task (kept for compatibility) ─────────────────────
export async function DELETE(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const id   = searchParams.get('id');
    const type = searchParams.get('type');
    if (!id || !type) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    try {
        if (type === 'user') {
            await deleteUser(id);
        } else if (type === 'task') {
            await deleteTaskAdmin(id);
        } else {
            return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('[/api/admin/data DELETE]', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
