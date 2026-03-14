/**
 * Server-side OTP store for WhatsApp OTP mode.
 *
 * Uses globalThis to survive Next.js hot module reloads in development.
 *
 * Production note: Replace with Redis or Firestore (via Admin SDK) for
 * distributed/serverless environments where in-memory state is not shared
 * across server instances.
 */

export interface OtpRecord {
  otp: string;
  expiresAt: number; // Unix ms
  attempts: number;  // Track failed attempts to prevent brute force
}

declare global {
  // eslint-disable-next-line no-var
  var _otpStore: Map<string, OtpRecord> | undefined;
}

if (!globalThis._otpStore) {
  globalThis._otpStore = new Map<string, OtpRecord>();
}

export const otpStore = globalThis._otpStore;

/** Purge expired entries to prevent memory bloat. */
export function pruneExpiredOtps() {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(key);
    }
  }
}
