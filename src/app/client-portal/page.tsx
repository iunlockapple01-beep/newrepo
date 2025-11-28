

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { LoginButton } from '@/components/login-button';
import { MessageSquare } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirebase, useDoc } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Define the structure for a submission
interface Submission {
  id: string;
  model: string;
  price: number;
  image: string;
  imei: string;
  status: 'waiting' | 'eligible' | 'not_supported' | 'paid';
  feedback: string[] | null;
  createdAt: any;
}

function DeviceCheckContent() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const model = searchParams.get('model') || 'Unknown Model';
  const price = Number(searchParams.get('price')) || 0;
  const image = searchParams.get('image') || '/placeholder.svg';

  const [imei, setImei] = useState('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const { data: submission, loading: submissionLoading } = useDoc<Submission>('submissions', submissionId || ' ');

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClear = () => {
    setImei('');
    setSubmissionId(null);
    if(typeof window !== 'undefined') {
      sessionStorage.removeItem('current_submission_id');
    }
  };

  useEffect(() => {
    const currentId = sessionStorage.getItem('current_submission_id');
    if (currentId) {
      // Temporarily load submission from session to check model
      const tempSub = JSON.parse(sessionStorage.getItem(`submission_data_${currentId}`) || '{}');
      if (tempSub.model === model) {
        setSubmissionId(currentId);
      } else {
        handleClear();
      }
    } else {
        setImei(''); // Clear IMEI if there's no submission in session
    }
  }, [model]);


  useEffect(() => {
    if (!userLoading && !user) {
      const redirectPath = `/client-portal?${searchParams.toString()}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [user, userLoading, router, searchParams]);
  
  useEffect(() => {
    if (submission && submissionId) {
        sessionStorage.setItem(`submission_data_${submissionId}`, JSON.stringify({ model: submission.model, imei: submission.imei }));
    }
  }, [submission, submissionId]);

  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  const handleSubmitImei = async () => {
    if (!imei.trim() || !user) {
      alert('Please enter an IMEI or Serial number.');
      return;
    }
    const newSubmission = {
      userId: user.uid,
      model,
      price,
      image,
      imei: imei.trim(),
      status: 'waiting' as 'waiting',
      feedback: null,
      createdAt: serverTimestamp(),
    };
    
    addDoc(collection(firestore, 'submissions'), newSubmission)
      .then(docRef => {
        setSubmissionId(docRef.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('current_submission_id', docRef.id);
          sessionStorage.setItem(`submission_data_${docRef.id}`, JSON.stringify({ model: newSubmission.model, imei: newSubmission.imei }));
        }
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: `submissions/unknown`, // Path is unknown until doc is created
          operation: 'create',
          requestResourceData: newSubmission,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Error creating submission: ", serverError);
        alert('Failed to create submission.');
      });
  };

  const openPaymentModal = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setPaymentModalOpen(true);
    }, 1200);
  };
  
  const handlePaid = async () => {
      if (!submissionId || !submission || !user) return alert('No submission selected.');
      
      const newOrder = {
          userId: user.uid,
          submissionId: submissionId,
          imei: submission.imei,
          model: submission.model,
          price: submission.price,
          status: 'confirming_payment' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      };

      addDoc(collection(firestore, 'orders'), newOrder)
        .then((docRef) => {
            setPaymentModalOpen(false);
            alert(`Payment submitted for confirmation. Your Order ID is: ${docRef.id}. You will be redirected to your account page.`);
            router.push('/my-account');
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: `orders/unknown`,
              operation: 'create',
              requestResourceData: newOrder,
            });
            errorEmitter.emit('permission-error', permissionError);
            console.error("Error creating order: ", serverError);
            alert('Failed to create order.');
      });
  };

  const telegramIconImage = PlaceHolderImages.find(img => img.id === 'telegram-icon');
  const usdtImage = PlaceHolderImages.find(img => img.id === 'usdt-icon');
  
  if (userLoading || !user) {
    return (
        <div className="flex justify-center items-center h-screen">
            <div>Loading...</div>
        </div>
    );
  }
  
  return (
    <div className="bg-gray-50 text-gray-800">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center gap-2">
                      <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
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
                            <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Admin</Link>
                        )}
                        <LoginButton />
                    </div>
                </div>
            </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-32 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg md:flex md:gap-6 md:items-center">
          <div className="relative w-full md:w-56 h-36 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden mb-4 md:mb-0">
             <Image src={image} alt={model} layout="fill" objectFit="cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{model}</h2>
            <div className="text-xl font-bold text-blue-600 mb-2">${price}</div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Input
                id="imei-input"
                type="text"
                placeholder="Enter IMEI or Serial number"
                value={submission ? submission.imei : imei}
                onChange={(e) => setImei(e.target.value)}
                className="w-full sm:w-80"
                disabled={!!submission}
              />
              <div className="flex gap-3">
                <Button onClick={handleSubmitImei} className="btn-primary text-white" disabled={!!submission}>Check IMEI</Button>
                <Button onClick={handleClear} variant="outline">Clear</Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              By submitting, we will check if your device is supported. We will respond with a short 7-line check result.
            </p>
          </div>
        </div>

        <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[120px] flex items-center justify-center flex-col text-center">
          {!submissionId && !submissionLoading && (
            <div>
              <p className="font-semibold text-gray-700">No IMEI submitted yet.</p>
              <p className="text-sm text-gray-500">Submit your IMEI or serial number to check if unlock is supported.</p>
            </div>
          )}
          {submissionLoading && (
             <div className="flex flex-col items-center">
              <div className="spinner w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="font-semibold">Loading submission...</p>
            </div>
          )}
          {submission && submission.status === 'waiting' && (
            <div className="flex flex-col items-center">
              <div className="spinner w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="font-semibold">Waiting for results...</p>
              <p className="text-sm text-gray-500">Admin will run checks and send feedback here.</p>
            </div>
          )}
          {submission && (submission.status === 'eligible' || submission.status === 'not_supported') && (
            <div className="w-full text-left">
              <div className="space-y-2">
                {submission.feedback?.map((line, index) => (
                  <div key={index} className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm whitespace-pre-wrap font-mono">
                    {line}
                  </div>
                ))}
              </div>
              {submission.status === 'eligible' && (
                <div className="mt-4 text-right flex items-center justify-end gap-4 animate-fade-in">
                  <p className="bg-green-100 text-green-800 font-semibold p-2 px-3 rounded-lg">✅ This device is eligible for iCloud Unlock</p>
                  <Button onClick={openPaymentModal} className="btn-primary text-white">Proceed with Unlock</Button>
                </div>
              )}
               {submission.status === 'not_supported' && (
                 <p className="bg-red-100 text-red-800 font-semibold p-2 px-3 rounded-lg mt-4 text-center">❌ This device is not supported for unlock.</p>
               )}
            </div>
          )}
           {!submission && !submissionLoading && submissionId && (
            <div>
              <p className="font-semibold text-destructive">This submission was not found.</p>
              <p className="text-sm text-gray-500">It may have been deleted by an administrator. Please clear and try again.</p>
            </div>
           )}
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <div className="mb-4 flex items-center gap-2">
                      <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
                    </div>
                    <p className="text-gray-400">Professional Apple device unlocking service</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                        <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                        <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                        <li><Link href="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Join our Telegram</h4>
                    <a href="https://t.me/iCloudUnlocksGroup" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white inline-flex items-center">
                        <Image 
                            src={telegramIconImage?.imageUrl || ''} 
                            alt="Telegram Group" 
                            width={18} 
                            height={18}
                            className="mr-2"
                        />
                        Telegram Channel
                    </a>
                    <h4 className="font-semibold mb-4 mt-4">Contact Us</h4>
                     <a href="https://t.me/iCloudUnlocks" className="text-gray-400 hover:text-white inline-flex items-center mb-2">
                        <Image 
                             src={telegramIconImage?.imageUrl || ''} 
                            alt="Telegram" 
                            width={18} 
                            height={18}
                            className="mr-2"
                        />
                        Contact us on Telegram
                    </a>
                     <a href="https://wa.me/message/EJ6T3XS4OWK3M1" className="text-gray-400 hover:text-white inline-flex items-center">
                        <MessageSquare className="mr-2" />
                        Contact us on WhatsApp
                    </a>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                 <p>
                    <Link href="/terms">Terms & Conditions</Link> |
                    <Link href="/privacy">Privacy Policy</Link> |
                    <a href="/reviews">Reviews</a> |
                    <Link href="/contact">Contact Us</Link> |
                    <Link href="/faq">FAQ</Link>
                </p>
                <p className="mt-4">&copy; 2025 iCloud Unlocks. All rights reserved.</p>
            </div>
        </div>
      </footer>
      
      <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Pay with Crypto</DialogTitle>
            </DialogHeader>
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-center">
                        {usdtImage && (
                          <Image 
                            src={usdtImage.imageUrl} 
                            alt="USDT"
                            width={80} 
                            height={80}
                            className="rounded-full" 
                            data-ai-hint="usdt logo"
                          />
                        )}
                    </div>
                    <div className="text-sm">
                        <div className="text-gray-500">Service</div>
                        <div>iCloud Unlock</div>
                    </div>
                    <div className="text-sm">
                        <div className="text-gray-500">Device</div>
                        <div>{model}</div>
                    </div>
                     <div className="text-sm">
                        <div className="text-gray-500">Amount (USD)</div>
                        <div>${price}</div>
                    </div>
                    <div className="text-sm">
                        <div className="text-gray-500">Pay to (USDT BEP20)</div>
                        <div className="font-mono bg-gray-100 p-2 rounded-md break-all">0x69dfEded84C7E5baAB723FF65e1C587f2E50b3f4</div>
                    </div>
                </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                <Button onClick={handlePaid} className="btn-primary text-white">I Paid</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
           <div className="spinner w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
           <p className="font-semibold text-gray-600">Processing payment...</p>
        </div>
      )}

    </div>
  );
}


export default function ClientPortalPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DeviceCheckContent />
        </Suspense>
    )
}
