/**
 * /api/admin/users
 *
 * Dedicated API for the Admin Portal — User Registry panel.
 *
 * GET  ?secret=&limit=5&offset=0
 *      Returns { users, total, hasMore }
 *
 * DELETE ?secret=&id=<userId>
 *      Permanently removes a user and all their tasks.
 */

import { NextResponse } from 'next/server';
import { getAllUsers, deleteUser, findUserById } from '@/lib/db';
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

// ── GET — paginated user list ─────────────────────────────────────────────────
export async function GET(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const limit  = parseInt(searchParams.get('limit')  || '5',  10);
    const offset = parseInt(searchParams.get('offset') || '0',  10);

    try {
        const allUsers = await getAllUsers();
        const total    = allUsers.length;
        const users    = allUsers.slice(offset, offset + limit);
        const hasMore  = offset + limit < total;

        return NextResponse.json({ users, total, hasMore });
    } catch (error) {
        console.error('[/api/admin/users GET]', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// ── DELETE — remove a single user (and their tasks) ───────────────────────────
export async function DELETE(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

    try {
        await deleteUser(id);
        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('[/api/admin/users DELETE]', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
