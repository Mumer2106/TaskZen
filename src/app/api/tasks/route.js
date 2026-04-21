import { NextResponse } from 'next/server';
import { getTasksForUser, addTask, deleteTasks } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await getTasksForUser(userId, search);
    return NextResponse.json(tasks);
}

export async function POST(request) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, taskDate } = await request.json();
    
    if (!title || title.trim().length === 0) {
        return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }
    if (title.length > 100) {
        return NextResponse.json({ error: 'Task title is too long (max 100 chars)' }, { status: 400 });
    }
    if (description && description.length > 1000) {
        return NextResponse.json({ error: 'Description is too long (max 1000 chars)' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const finalTaskDate = taskDate || today;

    if (finalTaskDate < today) {
        return NextResponse.json({ error: 'Cannot set tasks in the past' }, { status: 400 });
    }

    const newTask = {
        id: Date.now().toString(),
        userId,
        title,
        description,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        taskDate: finalTaskDate
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
