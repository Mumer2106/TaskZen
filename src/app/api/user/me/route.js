import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('auth_session')?.value;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await findUserById(userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return user data with safe fallbacks
        return NextResponse.json({
            user: {
                id: user.id || user.userId || userId,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.username || '',
                profilePic: user.profilePic || null,
                role: user.role || 'user',
            }
        });
    } catch (error) {
        console.error("Fetch user error:", error);
        
        // Provide a clearer error message for the 500 status
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message || 'Unknown database or server error'
        }, { status: 500 });
    }
}
