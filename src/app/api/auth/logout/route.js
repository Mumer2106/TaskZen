import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.delete('auth_session');
    response.cookies.delete('user_info');
    return response;
}
