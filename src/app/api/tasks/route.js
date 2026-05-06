import { NextResponse } from 'next/server';
import { getTasksForUser, addTask, deleteTasks } from '@/lib/db';
import { validateSession } from '@/lib/auth-server';

export async function GET(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit  = parseInt(searchParams.get('limit')  || '0', 10);  // 0 = no limit (legacy)
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch all matching tasks then slice — works for both JSON and Postgres adapters
    const allTasks = await getTasksForUser(userId, search);
    const total    = allTasks.length;

    if (limit > 0) {
        const tasks   = allTasks.slice(offset, offset + limit);
        const hasMore = offset + limit < total;
        return NextResponse.json({ tasks, total, hasMore });
    }

    // Legacy: return flat array so existing callers aren't broken
    return NextResponse.json(allTasks);
}

export async function POST(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

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
    const { response, userId } = await validateSession();
    if (response) return response;

    const { ids } = await request.json();
    await deleteTasks(userId, ids);
    return NextResponse.json({ message: 'Tasks deleted successfully' });
}
