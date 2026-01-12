import { getSdks } from '@/firebase/server';
import { type NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

// This is a simplified, insecure method to sign in a user for the purposes of this demo.
// In a real application, you would validate the password. Here we are just getting the user by email.
async function signInWithEmail(email: string) {
  const { auth } = getSdks();
  try {
    const user = await auth.getUserByEmail(email);
    return user;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const { email, password, role } = await request.json();

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  try {
    const { firestore, auth } = getSdks();

    // WARNING: In a real app, you would validate the password.
    // We are skipping password validation here for simplicity. This is insecure.
    const user = await signInWithEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'The email or password you entered is incorrect.' }, { status: 401 });
    }

    const profileRef = doc(firestore, 'users', user.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      return NextResponse.json({ error: 'Profile not found for this user.' }, { status: 404 });
    }

    const userProfile = profileSnap.data() as UserProfile;

    if (userProfile.role !== role) {
      return NextResponse.json({ error: 'The selected role is incorrect for this account.' }, { status: 403 });
    }

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(user.uid, { expiresIn });

    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    const response = NextResponse.json({ success: true, role: userProfile.role }, { status: 200 });
    response.cookies.set(options);

    return response;

  } catch (error: any) {
    console.error('API Login Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
