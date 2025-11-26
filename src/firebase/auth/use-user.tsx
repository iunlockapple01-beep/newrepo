'use client';
import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  Auth,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { useAuth } from '../provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
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

export async function signInWithGoogle(auth: Auth, firestore: Firestore) {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Create or update user in Firestore
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(
      userRef,
      {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error signing in with Google', error);
  }
}

export async function signOut(auth: Auth) {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out', error);
  }
}
