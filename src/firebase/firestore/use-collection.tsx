
'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  collection,
  query,
  Query,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { useMemo } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

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

  const memoizedConstraints = options?.constraints;

  useEffect(() => {
    // If constraints are defined but some dependency is not ready (e.g. user is not loaded),
    // don't fetch the collection.
    if (options?.constraints && !memoizedConstraints) {
      setLoading(false);
      setData([]); // Set to empty array to avoid null issues
      return;
    }

    let q: Query<DocumentData>;
    const collectionRef = collection(firestore, collectionName);

    if (memoizedConstraints) {
      q = query(collectionRef, ...memoizedConstraints);
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
      (serverError) => {
        setError(serverError);
        setLoading(false);
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionName, memoizedConstraints]);

  return { data, loading, error };
}
