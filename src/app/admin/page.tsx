
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cloud } from 'lucide-react';
import { LoginButton } from '@/components/login-button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Submission {
  id: string;
  userId: string;
  model: string;
  price: number;
  imei: string;
  status: 'waiting' | 'feedback' | 'paid';
  feedback: string[] | null;
}

function AdminDashboard() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const { data: submissions, loading: submissionsLoading } =
    useCollection<Submission>('submissions');

  const [feedbackValues, setFeedbackValues] = useState<{ [key: string]: string }>({});
  
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

  const handleSendFeedback = async (submissionId: string) => {
    const feedbackText = feedbackValues[submissionId];
    if (!feedbackText || !feedbackText.trim()) {
      return alert('Please enter feedback.');
    }
    const lines = feedbackText.split('\n').filter(l => l.trim());

    const submissionRef = doc(firestore, 'submissions', submissionId);
    const updatedData = {
      feedback: lines,
      status: 'feedback' as const,
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

  if (userLoading || !user || !isAdmin) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen">
       <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gradient flex items-center gap-2">
                <Cloud /> iCloud Server
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
                <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Services</Link>
                 {user && (
                    <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-primary">Admin</Link>
                )}
                <a href="#about" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a>
                <a href="#contact" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Contact</a>
                <LoginButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-32 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-10">Admin Dashboard</h1>

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
                <div className='mt-4 flex justify-end gap-2'>
                    <Button onClick={() => handleSendFeedback(sub.id)} className="btn-primary text-white">Send Feedback</Button>
                    <Button onClick={() => handleDelete(sub.id)} variant="destructive">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}


export default function AdminPage() {
    return <AdminDashboard />
}
