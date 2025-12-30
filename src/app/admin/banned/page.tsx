
'use client';

import {
  useUser,
  useFirebase,
  useCollection,
} from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
import { ArrowLeft, Menu, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface BannedUser {
  id: string;
  userId: string;
  createdAt: { toDate: () => Date };
}

function BannedUsersDashboard() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const { data: bannedUsers, loading: bannedUsersLoading } = useCollection<BannedUser>('banned_users');
  const [newBannedId, setNewBannedId] = useState('');

  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login?redirect=/admin/banned');
    } else if (!isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  const handleAddBannedUser = async () => {
    const trimmedId = newBannedId.trim();
    if (!trimmedId) {
      return alert('Please enter a User ID.');
    }

    const bannedUserRef = doc(firestore, 'banned_users', trimmedId);
    const bannedUserData = {
      userId: trimmedId,
      createdAt: serverTimestamp(),
    };

    setDoc(bannedUserRef, bannedUserData)
      .then(() => {
        alert('User ID added to banned list.');
        setNewBannedId('');
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: bannedUserRef.path,
          operation: 'create',
          requestResourceData: bannedUserData,
        });
        errorEmitter.emit('permission-error', permissionError);
        alert('Failed to add user to banned list.');
      });
  };

  const handleRemoveBannedUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user from the banned list?')) {
        const bannedUserRef = doc(firestore, 'banned_users', userId);
        deleteDoc(bannedUserRef)
            .then(() => {
                alert('User removed from banned list.');
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: bannedUserRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
                alert('Failed to remove user.');
            });
    }
  };

  if (userLoading || !user || !isAdmin) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen">
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

      <main className="max-w-4xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-10">
            <Link href="/admin">
                <Button variant="outline" size="icon">
                    <ArrowLeft />
                </Button>
            </Link>
            <h1 className="text-4xl font-bold">Banned Users</h1>
        </div>
        
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Add User to Banned List</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Label htmlFor="banned-id-input" className="sr-only">User ID</Label>
                    <Input
                        id="banned-id-input"
                        type="text"
                        value={newBannedId}
                        onChange={(e) => setNewBannedId(e.target.value)}
                        className="w-full"
                        placeholder="Enter User ID to ban"
                    />
                    <Button onClick={handleAddBannedUser} className="btn-primary text-white">Add</Button>
                </div>
            </CardContent>
        </Card>

        <h2 className="text-3xl font-bold mb-6">Currently Banned Users</h2>
        {bannedUsersLoading && <p>Loading banned users...</p>}
        {!bannedUsersLoading && (!bannedUsers || bannedUsers.length === 0) && (
            <p className='text-center text-gray-500'>No users are currently banned.</p>
        )}
        {bannedUsers && bannedUsers.length > 0 && (
            <Card>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {bannedUsers.map(b => (
                        <TableRow key={b.id}>
                            <TableCell className="font-mono text-xs">{b.userId}</TableCell>
                            <TableCell>{b.createdAt?.toDate().toLocaleDateString() || 'N/A'}</TableCell>
                            <TableCell className='text-right'>
                                <Button size="icon" variant="destructive" onClick={() => handleRemoveBannedUser(b.id)}>
                                    <Trash2 className='h-4 w-4' />
                                </Button>
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

export default function BannedUsersPage() {
    return <BannedUsersDashboard />
}
