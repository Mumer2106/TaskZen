/**
 * /api/user/heartbeat
 *
 * Ultra-lightweight endpoint called every 60 seconds from the user dashboard.
 * Updates the user's lastActive timestamp so the Admin Portal can show
 * accurate online/offline status.
 *
 * POST  (no body needed)  → { ok: true }
 */

import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-server';

export async function POST(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    // validateSession already calls touchUserActivity internally
    return NextResponse.json({ ok: true }, { status: 200 });
}
