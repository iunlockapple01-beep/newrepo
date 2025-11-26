'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Query,
  DocumentData,
  Firestore,
  QueryConstraint,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

interface UseCollectionOptions {
  constraints?: QueryConstraint[];
}

export function useCollection<T>(
  collectionName: string,
  options?: UseCollectionOptions
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q: Query<DocumentData>;
    const collectionRef = collection(firestore, collectionName);

    if (options?.constraints) {
      q = query(collectionRef, ...options.constraints);
    } else {
      q = query(collectionRef);
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as T)
        );
        setData(docs);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
        console.error(`Error fetching collection ${collectionName}:`, error);
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionName, options]);

  return { data, loading, error };
}
