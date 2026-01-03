

'use client';

import {
  useUser,
  useFirebase,
  useCollection,
  useDoc
} from '@/firebase';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoginButton } from '@/components/login-button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Ban, Menu, Users } from 'lucide-react';

interface Submission {
  id: string;
  userId: string;
  model: string;
  price: number;
  imei: string;
  status: 'waiting' | 'feedback' | 'paid' | 'eligible' | 'not_supported';
  feedback: string[] | null;
}

interface Order {
  id: string;
  orderId: string;
  userId: string;
  imei: string;
  model: string;
  price: number;
  status: 'confirming_payment' | 'approved' | 'declined' | 'unlocked';
  createdAt: { toDate: () => Date };
}

interface Counters {
    registeredUsers: number;
    unlockedDevices: number;
    orderCounter: number;
}

function AdminDashboard() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const { data: submissions, loading: submissionsLoading } =
    useCollection<Submission>('submissions');
  const { data: orders, loading: ordersLoading } = useCollection<Order>('orders');
  const { data: counters, loading: countersLoading } = useDoc<Counters>('counters', 'metrics');


  const [feedbackValues, setFeedbackValues] = useState<{ [key: string]: string }>({});
  const [feedbackStatus, setFeedbackStatus] = useState<{ [key: string]: 'eligible' | 'not_supported' | 'feedback' }>({});
  const [registeredUsers, setRegisteredUsers] = useState<number>(0);
  const [unlockedDevices, setUnlockedDevices] = useState<number>(0);
  const [orderCounter, setOrderCounter] = useState<number>(0);

  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  useEffect(() => {
    if (userLoading) {
      return; // Wait until user status is determined
    }
    if (!user) {
      router.push('/login?redirect=/admin');
    } else if (!isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  useEffect(() => {
    if (counters) {
      setRegisteredUsers(counters.registeredUsers || 0);
      setUnlockedDevices(counters.unlockedDevices || 0);
      setOrderCounter(counters.orderCounter || 0);
    }
  }, [counters]);

  const sortedSubmissions = submissions?.sort((a, b) => {
    if (a.status === 'waiting' && b.status !== 'waiting') return -1;
    if (a.status !== 'waiting' && b.status === 'waiting') return 1;
    return 0;
  });

  const handleFeedbackChange = (id: string, value: string) => {
    setFeedbackValues(prev => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = (id: string, value: 'eligible' | 'not_supported' | 'feedback') => {
    setFeedbackStatus(prev => ({ ...prev, [id]: value }));
  };

  const handleSendFeedback = async (submissionId: string) => {
    const feedbackText = feedbackValues[submissionId] || '';
    const status = feedbackStatus[submissionId];
    if (!status) {
      return alert('Please select an outcome.');
    }
    
    // Allow empty feedback text only if status is eligible
    if (feedbackText.trim() === '' && status !== 'eligible') {
        return alert('Please enter feedback for this outcome.');
    }

    const lines = feedbackText.split('\n').filter(l => l.trim());

    if (status === 'eligible') {
      lines.push('FIND_MY_ON_STATUS');
    }

    if (status === 'feedback') {
        lines.push('You Have Selected Wrong Device Model');
    }

    const submissionRef = doc(firestore, 'submissions', submissionId);
    const updatedData = {
      feedback: lines,
      status: status,
      updatedAt: serverTimestamp(),
    };
    try {
        await updateDoc(submissionRef, updatedData);
        alert('Feedback sent to client successfully!');
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: submissionRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        alert('Failed to send feedback.');
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!submissionId) {
      alert('Cannot delete: submission ID is missing.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this submission?')) {
      const submissionRef = doc(firestore, 'submissions', submissionId);
      try {
        await deleteDoc(submissionRef);
        alert('Submission deleted successfully.');
      } catch (serverError) {
        console.error('Failed to delete submission:', serverError);
        const permissionError = new FirestorePermissionError({
          path: submissionRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        alert('Failed to delete submission. See console for details.');
      }
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: Order['status']) => {
    const orderRef = doc(firestore, 'orders', orderId);
    const updatedData = { status, updatedAt: serverTimestamp() };
    updateDoc(orderRef, updatedData)
        .then(() => alert(`Order status updated to ${status}`))
        .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        alert('Failed to update order status.');
    });
  };

  const handleUpdateMetrics = async () => {
    const metricsRef = doc(firestore, 'counters', 'metrics');
    const metricsData = {
      registeredUsers: Number(registeredUsers),
      unlockedDevices: Number(unlockedDevices),
      orderCounter: Number(orderCounter),
    };
    
    setDoc(metricsRef, metricsData, { merge: true })
      .then(() => {
        alert('Site metrics updated successfully!');
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: metricsRef.path,
          operation: 'write',
          requestResourceData: metricsData,
        });
        errorEmitter.emit('permission-error', permissionError);
        alert('Failed to update site metrics.');
      });
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

      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
            <div className="mb-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Site Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {countersLoading ? <p>Loading metrics...</p> : (
                            <>
                                <div className='grid gap-2'>
                                    <Label htmlFor="registeredUsers">Registered Users</Label>
                                    <Input 
                                        id="registeredUsers" 
                                        type="number" 
                                        value={registeredUsers} 
                                        onChange={(e) => setRegisteredUsers(Number(e.target.value))} />
                                </div>
                                <div className='grid gap-2'>
                                    <Label htmlFor="unlockedDevices">Unlocked Devices</Label>
                                    <Input 
                                        id="unlockedDevices" 
                                        type="number" 
                                        value={unlockedDevices} 
                                        onChange={(e) => setUnlockedDevices(Number(e.target.value))} />
                                </div>
                                <div className='grid gap-2'>
                                    <Label htmlFor="orderCounter">Last Order ID</Label>
                                    <Input 
                                        id="orderCounter" 
                                        type="number" 
                                        value={orderCounter} 
                                        onChange={(e) => setOrderCounter(Number(e.target.value))} />
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between flex-wrap gap-2">
                        <Button onClick={handleUpdateMetrics} className="btn-primary text-white">Update Metrics</Button>
                        <div className="flex gap-2">
                            <Link href="/admin/users">
                                <Button variant="outline">
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage Users
                                </Button>
                            </Link>
                             <Link href="/admin/banned">
                                <Button variant="destructive">
                                    <Ban className="mr-2 h-4 w-4" />
                                    Banned Users
                                </Button>
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            <h1 className="text-4xl font-bold text-center mb-10">IMEI/SERIAL Submissions</h1>
            {submissionsLoading && <p>Loading submissions...</p>}
            {!submissionsLoading && (!sortedSubmissions || sortedSubmissions.length === 0) && (
                <p className='text-center text-gray-500'>No pending IMEI submissions found.</p>
            )}
            <div className="space-y-6">
              {sortedSubmissions && sortedSubmissions.map(sub => (
                <Card key={sub.id} className={`bg-white ${sub.status === 'waiting' ? 'border-2 border-primary' : ''}`}>
                  <CardHeader>
                    <CardTitle className='flex justify-between items-center'>
                        <span>{sub.model}</span>
                        <Badge variant={sub.status === 'waiting' ? 'default' : 'secondary'} className={sub.status === 'waiting' ? 'animate-pulse' : ''}>
                          {sub.status}
                        </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">User ID: {sub.userId}</p>
                    <p className="text-sm text-gray-600">IMEI/Serial: <strong>{sub.imei}</strong></p>
                    <p className="text-sm text-gray-600">Price: ${sub.price}</p>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Enter Feedback (paste full details):
                      </label>
                      <Textarea
                        value={feedbackValues[sub.id] || sub.feedback?.filter(l => l !== 'FIND_MY_ON_STATUS' && l !== 'You Have Selected Wrong Device Model').join('\n') || ''}
                        onChange={(e) => handleFeedbackChange(sub.id, e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className='flex-col items-stretch gap-3'>
                    <Select onValueChange={(value: 'eligible' | 'not_supported' | 'feedback') => handleStatusChange(sub.id, value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Outcome..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="eligible">Eligible for Unlock</SelectItem>
                            <SelectItem value="not_supported">Not Supported for Unlock</SelectItem>
                            <SelectItem value="feedback">Choose correct device model and Check again</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className='flex justify-end gap-2'>
                        <Button onClick={() => handleSendFeedback(sub.id)} className="btn-primary text-white">Send Feedback</Button>
                        <Button onClick={() => handleDelete(sub.id)} variant="destructive">Delete</Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
        </div>

        <div>
            <h1 className="text-4xl font-bold text-center mb-10">Client Orders</h1>
            {ordersLoading && <p>Loading orders...</p>}
            {!ordersLoading && (!orders || orders.length === 0) && (
                <p className='text-center text-gray-500'>No orders found.</p>
            )}
             {orders && orders.length > 0 && (
                <Card>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Order Date</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>IMEI</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {orders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell>{order.createdAt.toDate().toLocaleDateString()}</TableCell>
                                <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
                                <TableCell>{order.model}</TableCell>
                                <TableCell className="font-mono text-xs">{order.imei}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        order.status === 'approved' || order.status === 'unlocked' ? 'secondary' : 
                                        order.status === 'declined' ? 'destructive' : 'default'
                                    } className={order.status === 'confirming_payment' ? 'animate-pulse' : ''}>
                                    {order.status.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                     <Select value={order.status} onValueChange={(value: Order['status']) => handleOrderStatusChange(order.id, value)}>
                                        <SelectTrigger className='h-8'>
                                            <SelectValue placeholder="Update Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="confirming_payment">Confirming Payment</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="declined">Declined</SelectItem>
                                            <SelectItem value="unlocked">Unlocked</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </Card>
             )}
        </div>
      </main>
    </div>
  );
}


export default function AdminPage() {
    return <AdminDashboard />
}
