import { cookies } from 'next/headers';
import { findUserById } from './db';
import { NextResponse } from 'next/server';

/**
 * Validates the current session and checks for banned status.
 * returns { user, userId, response } 
 * If response is present, it means validation failed and the response should be returned.
 */
export async function validateSession() {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('auth_session')?.value;

    if (!sessionValue) {
        return { 
            response: NextResponse.json({ 
                error: 'Unauthorized',
                details: 'Neural link established, but authentication sequence missing.' 
            }, { status: 401 }) 
        };
    }

    const [userId, sessionToken] = sessionValue.split(':');

    try {
        const user = await findUserById(userId);

        if (!user) {
            // Stale session - Clear cookies
            cookieStore.delete('auth_session');
            cookieStore.delete('user_info');
            return { 
                response: NextResponse.json({ 
                    error: 'Unauthorized',
                    details: 'Session payload recognized, but persona data not found.' 
                }, { status: 401 }) 
            };
        }

        // Validate session token (invalidate on password change)
        if (user.sessionToken && user.sessionToken !== sessionToken) {
            cookieStore.delete('auth_session');
            cookieStore.delete('user_info');
            return { 
                response: NextResponse.json({ 
                    error: 'Session Expired',
                    details: 'Security parameters updated. Please re-authenticate.' 
                }, { status: 401 }) 
            };
        }

        if (user.isBanned) {
            // Automatically log out banned user - Clear both session and info cookies
            cookieStore.delete('auth_session');
            cookieStore.delete('user_info');
            return { 
                response: NextResponse.json({ 
                    error: 'Access Terminated',
                    details: 'This persona has been permanently decommissioned from the matrix.' 
                }, { status: 401 }) 
            };
        }

        // Tracking: Mark user as active on every authenticated request
        const { touchUserActivity } = await import('./db');
        await touchUserActivity(userId);

        return { user, userId };
    } catch (error) {
        console.error("Session Validation Error:", error);
        return { 
            response: NextResponse.json({ 
                error: 'System Error',
                details: 'The authentication conduit is unstable. Please retry later.' 
            }, { status: 500 }) 
        };
    }
}
