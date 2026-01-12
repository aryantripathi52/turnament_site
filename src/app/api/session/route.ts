
import { getAuth } from 'firebase-admin/auth';
import { getSdks } from '@/firebase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
getSdks();

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    // Verify the ID token first to ensure it's valid.
    const decodedIdToken = await getAuth().verifyIdToken(idToken);
    
    // Once verified, create a session cookie.
    // This is the correct flow: verify, then create cookie.
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
    
    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    // Set cookie
    cookies().set(options);

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    // Clear the session cookie
    cookies().delete('__session');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error clearing session cookie:', error);
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 });
  }
}
