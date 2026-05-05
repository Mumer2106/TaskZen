import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await findUserById(userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Never return the password — findUserById already strips it via sanitizeUser
        return NextResponse.json({
            user: {
                id: user.id || user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.username,
                profilePic: user.profilePic,
                role: user.role || 'user',
            }
        });
    } catch (error) {
        console.error("Fetch user error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
