'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AdminProvider } from '@/firebase/admin-provider';
import Link from 'next/link';
import { Cloud } from 'lucide-react';
import { useUser, useCollection, useFirebase } from '@/firebase';
import { LoginButton } from '@/components/login-button';
import { collection, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Define the structure for a submission
interface Submission {
  id: string;
  userId: string;
  model: string;
  price: number;
  image: string;
  imei: string;
  status: 'waiting' | 'feedback' | 'paid';
  feedback: string[] | null;
  createdAt: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

function AdminDashboard() {
  const { firestore } = useFirebase();
  const { data: user } = useUser();
  const { data: requests, loading } = useCollection<Submission>('submissions');
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  const handleSendFeedback = async (id: string) => {
    const textarea = document.getElementById(`feedback-${id}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const feedbackText = textarea.value.trim();
    if (!feedbackText) return alert('Please enter feedback.');

    const lines = feedbackText.split('\n').filter(l => l.trim());
    
    const submissionRef = doc(firestore, 'submissions', id);
    try {
      await updateDoc(submissionRef, {
        feedback: lines,
        status: 'feedback',
        updatedAt: serverTimestamp(),
      });
      alert('Feedback sent to client successfully!');
    } catch (error) {
      console.error("Error sending feedback: ", error);
      alert('Failed to send feedback.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    try {
      await deleteDoc(doc(firestore, 'submissions', id));
      alert('Submission deleted.');
    } catch (error) {
      console.error("Error deleting submission: ", error);
      alert('Failed to delete submission.');
    }
  }

  return (
    <>
     <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gradient flex items-center gap-2">
                <Cloud /> iCloud Server - Admin
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
                    <LoginButton />
                </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto py-32 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-10">Admin Dashboard</h1>
        
        <div className="space-y-6">
          {loading ? (
            <p className="text-center text-gray-500">Loading submissions...</p>
          ) : !requests || requests.length === 0 ? (
            <p className="text-center text-gray-500">No pending IMEI submissions found.</p>
          ) : (
            requests.map(sub => (
              <Card key={sub.id} className="request">
                <CardHeader>
                  <CardTitle>{sub.model}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="info">IMEI/Serial: <strong>{sub.imei}</strong></p>
                  <p className="info">Price: ${sub.price}</p>
                  <p className="info">
                    Status: <span className="font-semibold text-primary">{sub.status}</span>
                  </p>
                  <div className='mt-4'>
                    <label htmlFor={`feedback-${sub.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Enter Feedback (paste full details):
                    </label>
                    <Textarea 
                      id={`feedback-${sub.id}`} 
                      defaultValue={sub.feedback ? sub.feedback.join('\n') : ''}
                      rows={8}
                      className="font-mono"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button onClick={() => handleSendFeedback(sub.id)} className="btn-primary text-white">Send Feedback</Button>
                    <Button onClick={() => handleDelete(sub.id)} variant="destructive">Delete</Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </main>
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
            <p>&copy; 2025 iCloud Server. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default function AdminPage() {
    return (
        <AdminProvider>
            <AdminDashboard />
        </AdminProvider>
    )
}
