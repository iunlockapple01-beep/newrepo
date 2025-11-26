'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, doc, DocumentData, Firestore } from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useDoc<T>(collectionName: string, docId: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
        setLoading(false);
        setData(null);
        return;
    }
    
    const docRef = doc(firestore, collectionName, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
        console.error(
          `Error fetching document ${collectionName}/${docId}:`,
          error
        );
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionName, docId]);

  return { data, loading, error };
}
