
'use client';

import {
  useUser,
  useFirebase,
  useCollection,
} from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoginButton } from '@/components/login-button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, Menu } from 'lucide-react';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  balance?: number;
}

function UserManagementDashboard() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const [balances, setBalances] = useState<{ [key: string]: number }>({});

  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login?redirect=/admin/users');
    } else if (!isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  useEffect(() => {
    if (users) {
      const initialBalances = users.reduce((acc, u) => {
        acc[u.id] = u.balance || 0;
        return acc;
      }, {} as { [key: string]: number });
      setBalances(initialBalances);
    }
  }, [users]);

  const handleBalanceChange = (userId: string, value: string) => {
    setBalances(prev => ({ ...prev, [userId]: Number(value) }));
  };

  const handleUpdateBalance = async (userId: string) => {
    const newBalance = balances[userId];
    if (newBalance === undefined || isNaN(newBalance)) {
      return alert('Please enter a valid balance.');
    }

    const userRef = doc(firestore, 'users', userId);
    const updatedData = { balance: newBalance };

    try {
      await updateDoc(userRef, updatedData);
      alert('User balance updated successfully!');
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updatedData,
      });
      errorEmitter.emit('permission-error', permissionError);
      alert('Failed to update user balance.');
    }
  };

  if (userLoading || !user || !isAdmin) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 text-gray-800 flex flex-col min-h-screen">
       <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
              <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Services</Link>
               {user && (
                  <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-primary">Admin</Link>
              )}
              <LoginButton />
            </div>
             <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 p-4">
                    <Link href="/" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Home</Link>
                    <Link href="/services" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Services</Link>
                    {user && (
                        <Link href="/my-account" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">My Account</Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors ring-1 ring-inset ring-primary">Admin</Link>
                    )}
                    <div className='pt-4'>
                      <LoginButton />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center gap-4 mb-10">
            <Link href="/admin">
                <Button variant="outline" size="icon">
                    <ArrowLeft />
                </Button>
            </Link>
            <h1 className="text-4xl font-bold">User Management</h1>
        </div>
        
        {usersLoading && <p>Loading users...</p>}
        {!usersLoading && (!users || users.length === 0) && (
            <p className='text-center text-gray-500'>No users found.</p>
        )}
        {users && users.length > 0 && (
            <Card>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Current Balance ($)</TableHead>
                        <TableHead>Update Balance</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users.map(u => (
                        <TableRow key={u.id}>
                            <TableCell>{u.displayName}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell className="font-mono text-xs">{u.id}</TableCell>
                            <TableCell>${u.balance?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={balances[u.id] ?? ''}
                                    onChange={(e) => handleBalanceChange(u.id, e.target.value)}
                                    className="w-32"
                                    placeholder="Set new balance"
                                />
                                <Button size="sm" onClick={() => handleUpdateBalance(u.id)}>Update</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </Card>
        )}
      </main>
    </div>
  );
}

export default function AdminUsersPage() {
    return <UserManagementDashboard />
}
