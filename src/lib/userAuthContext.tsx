import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  signInWithGoogle,
  signInWithFacebook,
  signInWithEmail,
  signUpWithEmail,
  logOut,
  getFirebaseAuth,
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface UserAuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithFacebook: () => Promise<UserProfile>;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'chocobi_auth_user';

export const UserAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'அம்மா',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            providerId: (firebaseUser.providerData[0]?.providerId.replace('.com', '') as any) || 'password',
          };
          setUser(profile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        } else {
          // If no Firebase session and no guest session, reset
          const saved = localStorage.getItem(LOCAL_USER_KEY);
          if (!saved) {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async (): Promise<UserProfile> => {
    const profile = await signInWithGoogle();
    setUser(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return profile;
  };

  const loginWithFacebook = async (): Promise<UserProfile> => {
    const profile = await signInWithFacebook();
    setUser(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return profile;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    const profile = await signInWithEmail(email, pass);
    setUser(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return profile;
  };

  const registerWithEmail = async (email: string, pass: string, name?: string): Promise<UserProfile> => {
    const profile = await signUpWithEmail(email, pass, name);
    setUser(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    return profile;
  };

  const logout = async (): Promise<void> => {
    await logOut();
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const loginAsGuest = () => {
    const guestUser: UserProfile = {
      uid: 'guest-' + Date.now(),
      displayName: 'அம்மா (விருந்தினர் / Guest)',
      email: null,
      photoURL: null,
      providerId: 'guest',
    };
    setUser(guestUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(guestUser));
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithFacebook,
        loginWithEmail,
        registerWithEmail,
        logout,
        loginAsGuest,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = (): UserAuthContextType => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};
