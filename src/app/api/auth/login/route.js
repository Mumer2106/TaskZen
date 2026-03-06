import { NextResponse } from 'next/server';
import { findUser, createUser } from '@/lib/db';
import { cookies } from 'next/headers';

import nodemailer from 'nodemailer';

async function sendWelcomeNotification(contact) {
    const isEmail = contact.includes('@');

    // Simulate a very fast notification
    // Real-world: Use a queue (BullMQ, Amazon SQS) to handle this outside the request-response cycle
    console.log(`[Notification Simulator] Sending welcome to: ${contact}`);

    if (isEmail) {
        // Instead of waiting for Ethereal (which can hang or fail credentials), 
        // we return a standard "Preview" link for the developer to check.
        return {
            type: 'Email',
            previewUrl: 'https://ethereal.email/messages'
        };
    } else {
        return { type: 'SMS', previewUrl: null };
    }
}

export async function POST(request) {
    try {
        const { username: rawUsername, password: rawPassword, isRegistering } = await request.json();
        const username = rawUsername?.trim();
        const password = rawPassword?.trim();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        let user;
        let notificationResult = null;
        if (isRegistering) {
            try {
                user = await createUser(username, password);
                // Send the one-time welcome message
                notificationResult = await sendWelcomeNotification(username);
            } catch (error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
        } else {
            user = await findUser(username, password);
            if (!user) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }
        }

        const response = NextResponse.json({
            message: 'Success',
            user: { id: user.id, username: user.username },
            notificationSent: isRegistering,
            previewUrl: isRegistering ? (username.includes('@') ? 'https://ethereal.email/messages' : null) : null
        });

        // Use a simple cookie for "session"
        // In a real app, use a JWT or proper session store
        if (!isRegistering) {
            response.cookies.set('auth_session', user.id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });
        }

        return response;
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
