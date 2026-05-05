import { NextResponse } from 'next/server';
import { getAllUsers, getAllTasks, deleteUser, deleteTaskAdmin, updateTaskAdmin } from '@/lib/db';
import { findUserById } from '@/lib/db';
import { cookies } from 'next/headers';

async function requireAdmin(request) {
    // Priority 1: Check for master security key (Vault Access)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret === 'KC@210639') {
        return { ok: true, source: 'key' };
    }

    // Priority 2: Check for active admin session cookie
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

export async function GET(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const users = await getAllUsers();
        const tasks = await getAllTasks();

        return NextResponse.json({
            stats: {
                totalUsers: users.length,
                totalTasks: tasks.length,
                pendingTasks: tasks.filter(t => t.status === 'Pending').length,
                completedTasks: tasks.filter(t => t.status === 'Completed').length,
            },
            users,
            tasks
        });
    } catch (error) {
        console.error("Admin GET error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('id');
    const type = searchParams.get('type');
    if (!targetId || !type) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    try {
        const body = await request.json();
        if (type === 'task') {
            await updateTaskAdmin(targetId, body);
        } else {
            return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error("Admin PATCH error:", error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('id');
    const type = searchParams.get('type');
    if (!targetId || !type) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    try {
        if (type === 'user') {
            await deleteUser(targetId);
        } else if (type === 'task') {
            await deleteTaskAdmin(targetId);
        } else {
            return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error("Admin DELETE error:", error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
