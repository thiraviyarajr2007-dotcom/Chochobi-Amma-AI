import { db } from './db';

const SETTING_PIN_HASH = 'pin_salted_hash';
const SETTING_PIN_SALT = 'pin_salt';
const SETTING_BIO_ENABLED = 'biometric_enabled';
const SETTING_BIO_CRED_ID = 'biometric_cred_id';

const LOCKOUT_KEY_ATTEMPTS = 'chocobi_lockout_attempts';
const LOCKOUT_KEY_UNTIL = 'chocobi_lockout_until';

/**
 * Generate a cryptographically secure random 16-byte salt (hex string).
 */
export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash PIN with salt using browser WebCrypto SHA-256.
 */
export async function hashPinWithSalt(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${pin}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Set up a new PIN in IndexedDB (stores ONLY salt and SHA-256 hash).
 */
export async function setupNewPin(pin: string): Promise<boolean> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be exactly 4 digits');
  }
  const salt = generateSalt();
  const hash = await hashPinWithSalt(pin, salt);

  await db.settings.put({ key: SETTING_PIN_SALT, value: salt });
  await db.settings.put({ key: SETTING_PIN_HASH, value: hash });
  return true;
}

/**
 * Check if a PIN has been set up yet.
 */
export async function isPinSetup(): Promise<boolean> {
  const hashRecord = await db.settings.get(SETTING_PIN_HASH);
  return !!hashRecord && !!hashRecord.value;
}

/**
 * Verify an entered PIN against the stored salted hash.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const hashRecord = await db.settings.get(SETTING_PIN_HASH);
  const saltRecord = await db.settings.get(SETTING_PIN_SALT);

  if (!hashRecord || !saltRecord) {
    return false;
  }

  const computedHash = await hashPinWithSalt(pin, saltRecord.value);
  return computedHash === hashRecord.value;
}

/**
 * Lockout Escalation Manager
 * 5 wrong PINs -> 30-second cooldown (escalating on repeated lockout).
 */
export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
}

export function getLockoutStatus(): LockoutStatus {
  const until = parseInt(localStorage.getItem(LOCKOUT_KEY_UNTIL) || '0', 10);
  const attempts = parseInt(localStorage.getItem(LOCKOUT_KEY_ATTEMPTS) || '0', 10);
  const now = Date.now();

  if (until > now) {
    const remainingSeconds = Math.ceil((until - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      failedAttempts: attempts,
    };
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    failedAttempts: attempts,
  };
}

/**
 * Calculate lockout cooldown duration in seconds given failed attempts.
 */
export function calculateLockoutDuration(failedAttempts: number): number {
  if (failedAttempts < 5) return 0;
  // Escalating: 30s for 5 attempts, 60s for 10 attempts, 120s for 15+
  const multiplier = Math.pow(2, Math.floor((failedAttempts - 5) / 5));
  return Math.min(30 * multiplier, 300); // capped at 5 minutes
}

export function recordFailedPinAttempt(): LockoutStatus {
  const currentAttempts = parseInt(localStorage.getItem(LOCKOUT_KEY_ATTEMPTS) || '0', 10) + 1;
  localStorage.setItem(LOCKOUT_KEY_ATTEMPTS, currentAttempts.toString());

  if (currentAttempts >= 5) {
    const cooldownSec = calculateLockoutDuration(currentAttempts);
    const lockUntil = Date.now() + cooldownSec * 1000;
    localStorage.setItem(LOCKOUT_KEY_UNTIL, lockUntil.toString());
    return {
      isLocked: true,
      remainingSeconds: cooldownSec,
      failedAttempts: currentAttempts,
    };
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    failedAttempts: currentAttempts,
  };
}

export function resetLockoutState(): void {
  localStorage.removeItem(LOCKOUT_KEY_ATTEMPTS);
  localStorage.removeItem(LOCKOUT_KEY_UNTIL);
}

/**
 * WebAuthn Biometric Support & Operations
 */
export async function isWebAuthnSupported(): Promise<boolean> {
  try {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    return false;
  }
  return false;
}

export async function isBiometricEnabled(): Promise<boolean> {
  const supported = await isWebAuthnSupported();
  if (!supported) return false;

  const setting = await db.settings.get(SETTING_BIO_ENABLED);
  return setting?.value === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<boolean> {
  if (enabled) {
    const supported = await isWebAuthnSupported();
    if (!supported) return false;

    try {
      // Register credential with WebAuthn platform authenticator
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Chocobi Amma AI' },
          user: {
            id: new Uint8Array([1, 9, 3, 0]),
            name: 'amma@chocobi',
            displayName: 'Chocobi Amma',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 30000,
        },
      })) as PublicKeyCredential | null;

      if (credential) {
        await db.settings.put({ key: SETTING_BIO_ENABLED, value: 'true' });
        await db.settings.put({ key: SETTING_BIO_CRED_ID, value: credential.id });
        return true;
      }
    } catch (err) {
      console.warn('WebAuthn registration error/cancelled:', err);
      return false;
    }
  } else {
    await db.settings.put({ key: SETTING_BIO_ENABLED, value: 'false' });
    await db.settings.delete(SETTING_BIO_CRED_ID);
    return true;
  }
  return false;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const supported = await isWebAuthnSupported();
  if (!supported) return false;

  const enabled = await isBiometricEnabled();
  if (!enabled) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'required',
        timeout: 30000,
      },
    });

    return !!assertion;
  } catch (err) {
    console.warn('Biometric authentication failed or cancelled:', err);
    return false;
  }
}

