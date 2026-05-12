import { NextResponse } from 'next/server';
import { updateUser } from '@/lib/db';
import { validateSession } from '@/lib/auth-server';

export async function PATCH(request) {
    const { response, userId } = await validateSession();
    if (response) return response;

    try {
        const body = await request.json();
        const { username, password, firstName, lastName, profilePic } = body;

        const updates = {};
        if (username !== undefined) updates.username = username.trim().toLowerCase();
        // Pass raw new password — db.updateUser will bcrypt-hash it
        if (password !== undefined && password.trim().length > 0) updates.password = password.trim();
        if (firstName !== undefined) updates.firstName = firstName.trim();
        if (lastName !== undefined) updates.lastName = lastName.trim();
        if (profilePic !== undefined) updates.profilePic = profilePic;

        const updatedUser = await updateUser(userId, updates);

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const cookieOptions = {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        };

        const res = NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                profilePic: updatedUser.profilePic,
                email: updatedUser.username,
                role: updatedUser.role || 'user',
            }
        });

        // Refresh user_info cookie — no password field
        res.cookies.set('user_info', JSON.stringify({
            firstName: updatedUser.firstName || '',
            lastName: updatedUser.lastName || '',
            email: updatedUser.username || '',
            role: updatedUser.role || 'user',
        }), cookieOptions);

        return res;
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
