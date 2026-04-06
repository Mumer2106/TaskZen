import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
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

        return NextResponse.json({ 
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.username,
            profilePic: user.profilePic
        });
    } catch (error) {
        return NextResponse.json({ error: 'System processing error' }, { status: 500 });
    }
}
