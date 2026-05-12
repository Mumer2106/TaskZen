import { NextResponse } from 'next/server';
import { getTasksForUser, addTask, deleteTasks, updateTask, generateId } from '@/lib/db';
import { validateSession } from '@/lib/auth-server';

const DEFAULT_LIMIT = 5;

export async function GET(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit  = parseInt(searchParams.get('limit')  || String(DEFAULT_LIMIT), 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    try {
        const allTasks = await getTasksForUser(userId, search);
        const total    = allTasks.length;
        
        // Calculate statistics
        const completed = allTasks.filter(t => t.status === 'Completed').length;
        const pending   = total - completed;

        if (limit > 0) {
            const tasks   = allTasks.slice(offset, offset + limit);
            const hasMore = offset + limit < total;
            return NextResponse.json({ 
                tasks, 
                total, 
                hasMore,
                stats: { total, completed, pending }
            });
        }

        // Legacy: return flat array if limit=0
        return NextResponse.json(allTasks);
    } catch (error) {
        console.error('[/api/tasks GET]', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    try {
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
            id: generateId(),
            userId,
            title: title.trim(),
            description: (description || '').trim(),
            status: 'Pending',
            createdAt: new Date().toISOString(),
            taskDate: finalTaskDate
        };

        await addTask(userId, newTask);
        return NextResponse.json(newTask, { status: 201 });
    } catch (error) {
        console.error('[/api/tasks POST]', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}

export async function PATCH(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing task id' }, { status: 400 });

    try {
        const updates = await request.json();
        
        // Basic validation for dates if provided
        if (updates.taskDate) {
            const today = new Date().toISOString().split('T')[0];
            if (updates.taskDate < today) {
                // We allow updating existing tasks even if they are in the past
            }
        }

        await updateTask(userId, id, updates);
        return NextResponse.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('[/api/tasks PATCH]', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id && id !== 'BULK') {
            await deleteTasks(userId, [id]);
            return NextResponse.json({ message: 'Task deleted successfully' });
        }

        // Handle bulk delete
        const body = await request.json().catch(() => ({}));
        const ids = Array.isArray(body.ids) ? body.ids : (body.id ? [body.id] : []);
        
        if (ids.length === 0) {
            return NextResponse.json({ error: 'No task ids provided' }, { status: 400 });
        }

        await deleteTasks(userId, ids);
        return NextResponse.json({ message: `${ids.length} task(s) deleted successfully` });
    } catch (error) {
        console.error('[/api/tasks DELETE]', error);
        return NextResponse.json({ error: 'Failed to delete task(s)' }, { status: 500 });
    }
}
