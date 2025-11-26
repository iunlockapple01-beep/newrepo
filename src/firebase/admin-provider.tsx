
'use client';
import { ReactNode, useEffect } from 'react';
import { useUser } from './auth/use-user';
import { useRouter } from 'next/navigation';

interface AdminProviderProps {
  children: ReactNode;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

export function AdminProvider({ children }: AdminProviderProps) {
  const { data: user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      // Still checking user auth state
      return;
    }

    if (!user) {
      // Not logged in, redirect to home
      router.push('/');
      return;
    }

    // This is a temporary client-side check.
    // For real security, this should be done with custom claims.
    if (user.email !== ADMIN_EMAIL) {
       // Not the admin, redirect to home
       router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.email !== ADMIN_EMAIL) {
    // Render a loading state or nothing while checking/redirecting
    return <div className='flex justify-center items-center h-screen'>Loading...</div>;
  }

  // User is the admin, render the children
  return <>{children}</>;
}

    