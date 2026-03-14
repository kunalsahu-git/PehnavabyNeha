/**
 * OTP Authentication Configuration
 *
 * Set NEXT_PUBLIC_OTP_MODE in .env.local:
 *   test      → No real SMS. Uses Firebase test phone numbers (register in Firebase Console).
 *               Shows test credentials in UI for easy development.
 *   firebase  → Real Firebase Phone Auth (requires billing for real SMS).
 *   whatsapp  → Custom WhatsApp Business API flow via /api/auth/send-otp.
 */
export type OtpMode = 'test' | 'firebase' | 'whatsapp';

// Defaulting to 'test' to bypass "billing not enabled" errors during development
export const OTP_MODE: OtpMode = 'test';

/**
 * Test credentials for development.
 *
 * IMPORTANT: Register these exact numbers + OTPs in Firebase Console:
 *   Firebase Console → Authentication → Sign-in method → Phone → Test phone numbers
 *
 * This ensures the full Firebase Phone Auth flow is tested without consuming SMS quota.
 */
export const TEST_CREDENTIALS = [
  { phone: '+919999900001', otp: '123456', label: 'Test Admin' },
  { phone: '+919999900002', otp: '654321', label: 'Test Customer' },
] as const;

/** Returns the expected OTP for a test phone number, or null if not a test number. */
export function getTestOtp(fullPhone: string): string | null {
  return TEST_CREDENTIALS.find(c => c.phone === fullPhone)?.otp ?? null;
}
