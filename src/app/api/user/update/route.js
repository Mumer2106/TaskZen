import { NextResponse } from 'next/server';
import { updateUser } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PATCH(request) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { username, password, firstName, lastName, profilePic } = body;

        const updates = {};
        if (username !== undefined) updates.username = username.trim().toLowerCase();
        if (password !== undefined) updates.password = password.trim();
        if (firstName !== undefined) updates.firstName = firstName.trim();
        if (lastName !== undefined) updates.lastName = lastName.trim();
        if (profilePic !== undefined) updates.profilePic = profilePic;

        const updatedUser = await updateUser(userId, updates);

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const response = NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                profilePic: updatedUser.profilePic,
                email: updatedUser.username
            }
        });

        // Update user_info cookie
        response.cookies.set('user_info', JSON.stringify({
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.username
        }), {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
