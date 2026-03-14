/**
 * OTP Authentication Configuration
 *
 * Set NEXT_PUBLIC_OTP_MODE in .env.local:
 *   test      → No real SMS. Uses Firebase test phone numbers (register in Firebase Console).
 *               Shows test credentials in UI for easy development.
 *   firebase  → Real Firebase Phone Auth (uses your 10 SMS/day free quota).
 *   whatsapp  → Custom WhatsApp Business API flow via /api/auth/send-otp.
 *               Requires WHATSAPP_* and FIREBASE_ADMIN_* env vars.
 */
export type OtpMode = 'test' | 'firebase' | 'whatsapp';

export const OTP_MODE: OtpMode =
  (process.env.NEXT_PUBLIC_OTP_MODE as OtpMode) || 'firebase';

/**
 * Test credentials for development.
 *
 * IMPORTANT: Register these exact numbers + OTPs in Firebase Console:
 *   Firebase Console → Authentication → Sign-in method → Phone → Test phone numbers
 *
 * This ensures the full Firebase Phone Auth flow is tested without consuming SMS quota.
 */
export const TEST_CREDENTIALS = [
  { phone: '+919999900001', otp: '123456', label: 'Test Number 1' },
  { phone: '+919999900002', otp: '654321', label: 'Test Number 2' },
] as const;

/** Returns the expected OTP for a test phone number, or null if not a test number. */
export function getTestOtp(fullPhone: string): string | null {
  return TEST_CREDENTIALS.find(c => c.phone === fullPhone)?.otp ?? null;
}
