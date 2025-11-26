'use client';
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { initializeFirebase } from '.';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    setFirebase(initializeFirebase());
  }, []);

  if (!firebase) {
    return null; // or a loading indicator
  }

  return (
    <FirebaseContext.Provider value={firebase}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = (): FirebaseApp => {
  return useFirebase().firebaseApp;
};

export const useAuth = (): Auth => {
  return useFirebase().auth;
};

export const useFirestore = (): Firestore => {
  return useFirebase().firestore;
};

// You can also create a client-side provider if needed for specific cases
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    setFirebase(initializeFirebase());
  }, []);

  if (!firebase) {
    return null;
  }

  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}
