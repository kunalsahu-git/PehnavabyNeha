'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch((error) => {
    // If sign-up is restricted by admin, this will catch it
    console.error("Authentication Error:", error.code, error.message);
    // In a real app, we might emit this, but for now we let the UI handle specific button clicks
    throw error;
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch((error) => {
    console.error("Sign Up Error:", error.code, error.message);
    throw error;
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    console.error("Sign In Error:", error.code, error.message);
    throw error;
  });
}
