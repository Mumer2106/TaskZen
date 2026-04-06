import { NextResponse } from 'next/server';
import { findUser, createUser } from '@/lib/db';
import { cookies } from 'next/headers';

import nodemailer from 'nodemailer';

async function sendWelcomeNotification(contact, firstName) {
    // Create a transporter using Ethereal Email for testing/preview
    // In production, user would provide their own SMTP credentials
    let transporter;
    try {
        // Try creating a test account if no credentials are provided in process.env
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    } catch (error) {
        console.error("Failed to create test account:", error);
        return { type: 'Email', previewUrl: null };
    }

    const mailOptions = {
        from: '"TaskZen Team" <welcome@taskzen.io>',
        to: contact,
        subject: "Welcome to TaskZen - Account Created!",
        text: `Hello ${firstName},\n\nYou have successfully created a new account on TaskZen. Welcome to the flow!\n\nBest regards,\nThe TaskZen Team`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #ec4899; font-style: italic;">TaskZen</h1>
                <h2 style="color: #333;">Welcome to the Flow, ${firstName}!</h2>
                <p>Hello,</p>
                <p>You have successfully created a new account on <strong>TaskZen</strong>.</p>
                <p>Start managing your life simply and reaching your goals.</p>
                <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 5px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" style="background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Sign In to TaskZen</a>
                </div>
                <p style="color: #666; font-size: 14px;">If you did not create this account, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} TaskZen Team</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] Message ID: ${info.messageId}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Email Preview] URL: ${previewUrl}`);
        
        return {
            type: 'Email',
            previewUrl: previewUrl
        };
    } catch (error) {
        console.error("Error sending email:", error);
        return { type: 'Email', previewUrl: null };
    }
}

export async function POST(request) {
    try {
        const { username: rawUsername, password: rawPassword, isRegistering, firstName, lastName } = await request.json();
        const username = rawUsername?.trim();
        const password = rawPassword?.trim();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        let user;
        let notificationResult = null;
        if (isRegistering) {
            try {
                const id = Date.now().toString();
                user = await createUser(id, username, password, { firstName, lastName });
                // Send the one-time welcome message
                notificationResult = await sendWelcomeNotification(username, firstName || 'there');
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
            user: { 
                id: user.id, 
                username: user.username, 
                firstName: user.firstName, 
                lastName: user.lastName,
                profilePic: user.profilePic
            },
            notificationSent: isRegistering,
            previewUrl: notificationResult?.previewUrl
        });

        // Use a simple cookie for "session"
        // In a real app, use a JWT or proper session store
        response.cookies.set('auth_session', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        // Store user info in a non-httpOnly cookie for frontend access
        response.cookies.set('user_info', JSON.stringify({
            firstName: user.firstName,
            lastName: user.lastName,
            profilePic: user.profilePic,
            email: user.username
        }), {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
