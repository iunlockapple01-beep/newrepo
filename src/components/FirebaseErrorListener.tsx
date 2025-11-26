'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

// This is a client-side component that will listen for permission errors
// and throw them as uncaught exceptions to be displayed in the Next.js
// development overlay. This is only for development and should be
// conditionally rendered or removed in production.

export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // This will be caught by the Next.js error overlay in development
      setTimeout(() => {
        throw error;
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}
