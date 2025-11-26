
'use client';
import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  Auth,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { useAuth } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

interface CustomUser extends User {
    customClaims?: {
        role?: string;
    }
}

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
            const tokenResult = await user.getIdTokenResult();
            const userWithClaims: CustomUser = { 
                ...user, 
                customClaims: tokenResult.claims as { role?: string }
            };
            setUser(userWithClaims);
        } else {
            setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { data: user, loading, error };
}

export async function signInWithGoogle(auth: Auth, firestore: Firestore): Promise<UserCredential | null> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Create or update user in Firestore
    const userRef = doc(firestore, 'users', user.uid);
    const userData = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
    };

    setDoc(userRef, userData, { merge: true }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'create',
        requestResourceData: userData,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
    return result;
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'auth/popup-closed-by-user'
    ) {
      // Don't treat this as an application error.
      return null;
    }
    console.error('Error signing in with Google', error);
    return null;
  }
}

export async function signOut(auth: Auth) {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out', error);
  }
}

    