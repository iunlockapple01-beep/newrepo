

'use client';

import {
  useUser,
  useFirebase,
  useCollection,
} from '@/firebase';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  userId: string;
  imei: string;
  model: string;
  price: number;
  status: 'confirming_payment' | 'approved' | 'declined';
  createdAt: { toDate: () => Date };
}

function AdminDashboard() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const { data: submissions, loading: submissionsLoading } =
    useCollection<Submission>('submissions');
  const { data: orders, loading: ordersLoading } = useCollection<Order>('orders');

  const [feedbackValues, setFeedbackValues] = useState<{ [key: string]: string }>({});
  const [feedbackStatus, setFeedbackStatus] = useState<{ [key: string]: 'eligible' | 'not_supported' }>({});

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

  const handleFeedbackChange = (id: string, value: string) => {
    setFeedbackValues(prev => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = (id: string, value: 'eligible' | 'not_supported') => {
    setFeedbackStatus(prev => ({ ...prev, [id]: value }));
  };

  const handleSendFeedback = async (submissionId: string) => {
    const feedbackText = feedbackValues[submissionId];
    const status = feedbackStatus[submissionId];
    if (!feedbackText || !feedbackText.trim() || !status) {
      return alert('Please enter feedback and select a status.');
    }
    const lines = feedbackText.split('\n').filter(l => l.trim());

    const submissionRef = doc(firestore, 'submissions', submissionId);
    const updatedData = {
      feedback: lines,
      status: status,
      updatedAt: serverTimestamp(),
    };
    updateDoc(submissionRef, updatedData)
      .then(() => {
          alert('Feedback sent to client successfully!');
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: submissionRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        alert('Failed to send feedback.');
    });
  };

  const handleDelete = async (submissionId: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      const submissionRef = doc(firestore, 'submissions', submissionId);
      deleteDoc(submissionRef)
        .then(() => {
            alert('Submission deleted.');
        })
        .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: submissionRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        alert('Failed to delete submission.');
      });
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
                <Image src="https://i.postimg.cc/tCm66wrX/no-background.png" alt="iCloud Server Logo" width={90} height={24} />
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
                <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Services</Link>
                 {user && (
                    <Link href="/my-account" className="text-gray_700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-primary">Admin</Link>
                )}
                <LoginButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-32 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
            <h1 className="text-4xl font-bold text-center mb-10">IMEI Submissions</h1>
            {submissionsLoading && <p>Loading submissions...</p>}
            {!submissionsLoading && (!submissions || submissions.length === 0) && (
                <p className='text-center text-gray-500'>No pending IMEI submissions found.</p>
            )}
            <div className="space-y-6">
              {submissions && submissions.map(sub => (
                <Card key={sub.id} className="bg-white">
                  <CardHeader>
                    <CardTitle className='flex justify-between items-center'>
                        <span>{sub.model}</span>
                        <span className="text-sm font-medium text-blue-600">
                            Status: {sub.status}
                        </span>
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
                        value={feedbackValues[sub.id] || sub.feedback?.join('\n') || ''}
                        onChange={(e) => handleFeedbackChange(sub.id, e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className='flex-col items-stretch gap-3'>
                    <Select onValueChange={(value: 'eligible' | 'not_supported') => handleStatusChange(sub.id, value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Outcome..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="eligible">Eligible for Unlock</SelectItem>
                            <SelectItem value="not_supported">Not Supported for Unlock</SelectItem>
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
                                <TableCell>{order.model}</TableCell>
                                <TableCell className="font-mono text-xs">{order.imei}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        order.status === 'approved' ? 'secondary' : 
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
