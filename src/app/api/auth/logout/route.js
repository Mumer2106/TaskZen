import { NextResponse } from 'next/server';

import { cookies } from 'next/headers';
import { clearUserActivity } from '@/lib/db';

export async function POST() {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('auth_session')?.value;
    
    if (sessionValue) {
        const userId = sessionValue.split(':')[0];
        try {
            await clearUserActivity(userId);
        } catch (e) {
            console.error("Logout activity clearing error:", e);
        }
    }

    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.delete('auth_session');
    response.cookies.delete('user_info');
    return response;
}
