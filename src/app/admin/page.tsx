
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AdminProvider } from '@/firebase/admin-provider';
import Link from 'next/link';
import { Cloud } from 'lucide-react';
import { useUser } from '@/firebase';
import { LoginButton } from '@/components/login-button';

// Define the structure for a submission
interface Submission {
  id: string;
  model: string;
  price: number;
  image: string;
  imei: string;
  status: 'waiting' | 'feedback' | 'paid';
  feedback: string[] | null;
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'icloud_submissions';

// Helper functions to interact with localStorage
const readSubmissions = (): Submission[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

const writeSubmissions = (submissions: Submission[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  // Dispatch a storage event to notify other tabs/windows
  window.dispatchEvent(new Event('storage'));
};

function AdminDashboard() {
  const [requests, setRequests] = useState<Submission[]>([]);
  const { data: user } = useUser();
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  useEffect(() => {
    const loadRequests = () => setRequests(readSubmissions());
    loadRequests();

    const handleStorageChange = (e: Event) => {
        // Custom event dispatched from writeSubmissions
        loadRequests();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSendFeedback = (id: string) => {
    const textarea = document.getElementById(`feedback-${id}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const feedbackText = textarea.value.trim();
    if (!feedbackText) return alert('Please enter feedback.');

    const lines = feedbackText.split('\n').filter(l => l.trim());
    
    setRequests(prevRequests => {
      const newRequests = prevRequests.map(req => {
        if (req.id === id) {
          return {
            ...req,
            feedback: lines,
            status: 'feedback' as 'feedback',
            updatedAt: new Date().toISOString(),
          };
        }
        return req;
      });
      writeSubmissions(newRequests);
      alert('Feedback sent to client successfully!');
      return newRequests;
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    setRequests(prevRequests => {
      const newRequests = prevRequests.filter(req => req.id !== id);
      writeSubmissions(newRequests);
      alert('Submission deleted.');
      return newRequests;
    });
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
          {requests.length === 0 ? (
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
