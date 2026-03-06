import { NextResponse } from 'next/server';
import { getAllUsers, getAllTasks, deleteUser, deleteTaskAdmin } from '@/lib/db';

const ADMIN_SECRET = "KC@210639";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

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
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const targetId = searchParams.get('id');
    const type = searchParams.get('type'); // 'user' or 'task'

    if (secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (type === 'user') {
            await deleteUser(targetId);
        } else if (type === 'task') {
            await deleteTaskAdmin(targetId);
        }
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
