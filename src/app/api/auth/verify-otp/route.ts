import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/otp-store';

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone: string = body.phone;
    const otp: string = body.otp;

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required.' }, { status: 400 });
    }

    const record = otpStore.get(phone);

    if (!record) {
      return NextResponse.json(
        { error: 'No OTP found for this number. Request a new one.' },
        { status: 400 }
      );
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(phone);
      return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
    }

    record.attempts += 1;

    if (record.attempts > MAX_ATTEMPTS) {
      otpStore.delete(phone);
      return NextResponse.json(
        { error: 'Too many attempts. Request a new OTP.' },
        { status: 429 }
      );
    }

    if (record.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP. Try again.' }, { status: 400 });
    }

    // OTP correct - delete (single use)
    otpStore.delete(phone);

    // Create Firebase Custom Auth Token so the client can sign in
    // This requires Firebase Admin SDK with a service account key.
    if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      // Dev mode without Admin SDK: return success signal
      // Client will show appropriate message to configure for production
      return NextResponse.json({
        success: true,
        devMode: true,
        message: 'OTP verified. Add FIREBASE_ADMIN_* env vars to enable full sign-in.',
      });
    }

    const customToken = await createFirebaseCustomToken(phone);
    return NextResponse.json({ success: true, customToken });
  } catch (error) {
    console.error('[verify-otp] Error:', error);
    return NextResponse.json({ error: 'Verification failed. Try again.' }, { status: 500 });
  }
}

async function createFirebaseCustomToken(phone: string): Promise<string> {
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  // Derive a stable UID from the phone number
  const uid = `wa_${phone.replace(/\D/g, '')}`;
  return getAuth().createCustomToken(uid, { phone, provider: 'whatsapp' });
}
