import { NextResponse } from 'next/server';
import { updateTask, deleteTasks } from '@/lib/db';
import { validateSession } from '@/lib/auth-server';

export async function PATCH(request, { params }) {
    const { response, userId } = await validateSession();
    if (response) return response;

    const { id } = await params;
    const updates = await request.json();

    if (updates.taskDate) {
        const today = new Date().toISOString().split('T')[0];
        if (updates.taskDate < today) {
            return NextResponse.json({ error: 'Cannot set tasks in the past' }, { status: 400 });
        }
    }

    // Allow updates even to past tasks, as long as it's an update, not a new creation
    // This allows editing titles/descriptions of historical nodes.

    try {
        await updateTask(userId, id, updates);
        return NextResponse.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { response, userId } = await validateSession();
    if (response) return response;

    const { id } = await params;

    try {
        await deleteTasks(userId, [id]);
        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
