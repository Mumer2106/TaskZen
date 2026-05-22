/**
 * /api/admin/online
 *
 * Ultra-lightweight endpoint for the Admin Portal's "Active System Users" widget.
 * Returns ONLY user lastActive timestamps — no tasks, no heavy computation.
 * Used for targeted online/offline polling every 30 seconds.
 *
 * GET  ?secret=   → { users: [{ id, username, firstName, lastName, lastActive }] }
 */

import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';
const ADMIN_SECRET = 'KC@210639';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const allUsers = await getAllUsers();
        const now = Date.now();
        const THRESHOLD = 180 * 1000; // 3 min threshold for 30s heartbeat (avoids flickering)

        const users = [...allUsers]
            .sort((a, b) => {
                const dateA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
                const dateB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 30) // Top 30 most recently active
            .map(u => {
                const lastActiveTime = u.lastActive ? new Date(u.lastActive).getTime() : 0;
                return {
                    id: u.id,
                    username: u.username,
                    firstName: u.firstName || u.firstname || u.displayName || u.username?.split('@')[0] || '',
                    lastName: u.lastName || u.lastname || '',
                    lastActive: u.lastActive || null,
                    isOnline: lastActiveTime > 0 && (now - lastActiveTime) < THRESHOLD
                };
            });

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error('[/api/admin/online GET]', error);
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}
