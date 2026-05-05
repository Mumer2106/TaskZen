import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-server';

export async function GET(request) {
    try {
        const { response, user } = await validateSession();
        if (response) return response;

        // Return user data with safe fallbacks
        return NextResponse.json({
            user: {
                id: user.id || user.userId,
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
