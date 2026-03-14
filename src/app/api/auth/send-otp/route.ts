import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { otpStore, pruneExpiredOtps } from '@/lib/otp-store';

const PHONE_REGEX = /^\+91[6-9]\d{9}$/;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone: string = body.phone;

    if (!phone || !PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Use format: +91XXXXXXXXXX' },
        { status: 400 }
      );
    }

    // Rate limit: don't resend if a valid OTP was sent in the last 60 seconds
    const existing = otpStore.get(phone);
    if (existing && existing.expiresAt - OTP_TTL_MS + 60_000 > Date.now()) {
      return NextResponse.json(
        { error: 'Please wait before requesting another OTP.' },
        { status: 429 }
      );
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + OTP_TTL_MS;

    otpStore.set(phone, { otp, expiresAt, attempts: 0 });
    pruneExpiredOtps(); // Clean up old entries

    const isWhatsAppConfigured = !!(
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ACCESS_TOKEN
    );

    if (isWhatsAppConfigured) {
      await sendWhatsAppOtp(phone, otp);
    } else {
      // Development fallback: log OTP to server console
      // In production, configure WHATSAPP_* environment variables
      console.log(
        `\n[WhatsApp OTP - DEV MODE]\n  Phone: ${phone}\n  OTP: ${otp}\n  Expires: ${new Date(expiresAt).toISOString()}\n`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[send-otp] Error:', error);
    return NextResponse.json({ error: 'Failed to send OTP. Try again.' }, { status: 500 });
  }
}

async function sendWhatsAppOtp(phone: string, otp: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;

  // WhatsApp requires phone number without leading '+'
  const waPhone = phone.replace('+', '');

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: waPhone,
        type: 'template',
        template: {
          // Create this template in WhatsApp Business Manager before going live.
          // Template name: 'otp_verification', language: 'en', body: "Your OTP is {{1}}. Valid for 10 minutes."
          name: 'otp_verification',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otp }],
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(errorBody)}`);
  }
}
