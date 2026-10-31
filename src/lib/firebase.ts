import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: 'google' | 'facebook' | 'password' | 'guest';
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'chocobiamma-ai.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'chocobiamma-ai',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'chocobiamma-ai.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '810673902439',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5);
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  try {
    if (!getApps().length) {
      if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
      }
    } else {
      app = getApps()[0];
      auth = getAuth(app);
    }
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
  return auth;
}

// 1. Google Sign In
export async function signInWithGoogle(): Promise<UserProfile> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(firebaseAuth, provider);
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName || 'அம்மா (Google)',
      email: user.email,
      photoURL: user.photoURL,
      providerId: 'google',
    };
  }

  // Fallback demo user if API key is not yet set in environment
  const demoUser: UserProfile = {
    uid: 'demo-google-' + Date.now(),
    displayName: 'அம்மா (Google Demo)',
    email: 'amma.demo@gmail.com',
    photoURL: null,
    providerId: 'google',
  };
  localStorage.setItem('chocobi_auth_user', JSON.stringify(demoUser));
  return demoUser;
}

// 2. Facebook Sign In
export async function signInWithFacebook(): Promise<UserProfile> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');
    const result = await signInWithPopup(firebaseAuth, provider);
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName || 'அம்மா (Facebook)',
      email: user.email,
      photoURL: user.photoURL,
      providerId: 'facebook',
    };
  }

  // Fallback demo user
  const demoUser: UserProfile = {
    uid: 'demo-fb-' + Date.now(),
    displayName: 'அம்மா (Facebook Demo)',
    email: 'amma.facebook@demo.com',
    photoURL: null,
    providerId: 'facebook',
  };
  localStorage.setItem('chocobi_auth_user', JSON.stringify(demoUser));
  return demoUser;
}

// 3. Email & Password Sign In
export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    const result = await signInWithEmailAndPassword(firebaseAuth, email, pass);
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName || email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL,
      providerId: 'password',
    };
  }

  const demoUser: UserProfile = {
    uid: 'demo-email-' + Date.now(),
    displayName: email.split('@')[0],
    email,
    photoURL: null,
    providerId: 'password',
  };
  localStorage.setItem('chocobi_auth_user', JSON.stringify(demoUser));
  return demoUser;
}

// 4. Email & Password Sign Up
export async function signUpWithEmail(
  email: string,
  pass: string,
  name?: string
): Promise<UserProfile> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    const result = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    const user = result.user;
    if (name) {
      await updateProfile(user, { displayName: name });
    }
    return {
      uid: user.uid,
      displayName: name || user.displayName || email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL,
      providerId: 'password',
    };
  }

  const demoUser: UserProfile = {
    uid: 'demo-email-' + Date.now(),
    displayName: name || email.split('@')[0],
    email,
    photoURL: null,
    providerId: 'password',
  };
  localStorage.setItem('chocobi_auth_user', JSON.stringify(demoUser));
  return demoUser;
}

// 5. Sign Out
export async function logOut(): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    await signOut(firebaseAuth);
  }
  localStorage.removeItem('chocobi_auth_user');
}

