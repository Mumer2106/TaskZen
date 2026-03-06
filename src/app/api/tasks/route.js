import { NextResponse } from 'next/server';
import { getTasksForUser, addTask, deleteTasks } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await getTasksForUser(userId);
    return NextResponse.json(tasks);
}

export async function POST(request) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description } = await request.json();
    const newTask = {
        id: Date.now().toString(),
        userId,
        title,
        description,
        status: 'Pending',
        createdAt: new Date().toLocaleDateString()
    };

    await addTask(userId, newTask);
    return NextResponse.json(newTask, { status: 201 });
}

export async function DELETE(request) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();
    await deleteTasks(userId, ids);
    return NextResponse.json({ message: 'Tasks deleted successfully' });
}
