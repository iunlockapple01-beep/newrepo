
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Cloud, Twitter, Facebook, Instagram } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  paid?: boolean;
  paidAt?: string;
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
};

function DeviceCheckContent() {
  const searchParams = useSearchParams();
  const model = searchParams.get('model') || 'Unknown Model';
  const price = Number(searchParams.get('price')) || 0;
  const image = searchParams.get('image') || '/placeholder.svg';

  const [imei, setImei] = useState('');
  const [status, setStatus] = useState<'initial' | 'waiting' | 'feedback'>('initial');
  const [feedbackLines, setFeedbackLines] = useState<string[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isCryptoModalOpen, setCryptoModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const handleSubmitImei = () => {
    if (!imei.trim()) {
      alert('Please enter an IMEI or Serial number.');
      return;
    }
    const newSubmission: Submission = {
      id: `id-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      model,
      price,
      image,
      imei: imei.trim(),
      status: 'waiting',
      feedback: null,
      createdAt: new Date().toISOString(),
    };
    const submissions = readSubmissions();
    submissions.push(newSubmission);
    writeSubmissions(submissions);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('current_submission_id', newSubmission.id);
    }
    setStatus('waiting');
  };

  const handleClear = () => {
    setImei('');
  };

  const openCryptoModal = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCryptoModalOpen(true);
      setShowPaymentDetails(false);
      setTimeout(() => {
        setShowPaymentDetails(true);
      }, 2000);
    }, 1200);
  };
  
  const handleMarkAsPaid = () => {
      const payingId = sessionStorage.getItem('current_paying_id');
      if (!payingId) return alert('No submission selected.');
      
      const submissions = readSubmissions();
      const submissionIndex = submissions.findIndex(s => s.id === payingId);
      if (submissionIndex === -1) return alert('Submission not found.');
      
      submissions[submissionIndex].paid = true;
      submissions[submissionIndex].status = 'paid';
      submissions[submissionIndex].paidAt = new Date().toISOString();
      
      writeSubmissions(submissions);
      setCryptoModalOpen(false);
      alert('Marked as paid. Admin will process unlocking.');
      checkForUpdates(); // Re-check status immediately
  };
  

  const checkForUpdates = () => {
    const currentId = sessionStorage.getItem('current_submission_id');
    if (!currentId) return;

    const submissions = readSubmissions();
    const match = submissions.find(s => s.id === currentId);

    if (match) {
        if (match.status === 'feedback' && match.feedback) {
            setStatus('feedback');
            setFeedbackLines(match.feedback);
            setIsPaid(!!match.paid);
            // Simple eligibility check for demo purposes
            const isDeviceEligible = match.feedback.some(line => line.toLowerCase().includes('eligible'));
            setIsEligible(isDeviceEligible);
        } else if (match.status === 'paid') {
            setStatus('feedback');
            setFeedbackLines(match.feedback || ['Paid - unlocking...']);
            setIsPaid(true);
            setIsEligible(false);
        } else if (match.status === 'waiting') {
            setStatus('waiting');
        }
    }
  };

  useEffect(() => {
    const currentId = sessionStorage.getItem('current_submission_id');
    if (currentId) {
      checkForUpdates();
    }
    
    const interval = setInterval(checkForUpdates, 2500);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        checkForUpdates();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  useEffect(() => {
      if (isEligible && !isPaid) {
        sessionStorage.setItem('current_paying_id', sessionStorage.getItem('current_submission_id') || '');
      }
  }, [isEligible, isPaid]);

  const telegramIconImage = PlaceHolderImages.find(img => img.id === 'telegram-icon');


  return (
    <div className="bg-gray-50 text-gray-800">
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
                        <a href="/#about" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a>
                        <a href="/#contact" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Contact</a>
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
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="w-full sm:w-80"
              />
              <div className="flex gap-3">
                <Button onClick={handleSubmitImei} className="btn-primary text-white">Check IMEI</Button>
                <Button onClick={handleClear} variant="outline">Clear</Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              By submitting, we will check if your device is supported. We will respond with a short 7-line check result.
            </p>
          </div>
        </div>

        <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[120px] flex items-center justify-center flex-col text-center">
          {status === 'initial' && (
            <div>
              <p className="font-semibold text-gray-700">No IMEI submitted yet.</p>
              <p className="text-sm text-gray-500">Submit your IMEI or serial number to check if unlock is supported.</p>
            </div>
          )}
          {status === 'waiting' && (
            <div className="flex flex-col items-center">
              <div className="spinner w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="font-semibold">Waiting for results...</p>
              <p className="text-sm text-gray-500">Admin will run checks and send feedback here.</p>
            </div>
          )}
          {status === 'feedback' && (
            <div className="w-full text-left">
              <div className="space-y-2">
                {feedbackLines.map((line, index) => (
                  <div key={index} className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm whitespace-pre-wrap font-mono">
                    {line}
                  </div>
                ))}
              </div>
              {isPaid && (
                  <p className="text-sm text-gray-600 mt-3">Confirming your payment — Please refresh the My Account page. Once your payment is confirmed, your order details will appear there. If your order isn’t updated within 5 minutes, contact the admin with your payment details.</p>
              )}
              {!isPaid && isEligible && (
                <div className="mt-4 text-right flex items-center justify-end gap-4 animate-fade-in">
                  <p className="bg-green-100 text-green-800 font-semibold p-2 px-3 rounded-lg">✅ This device is eligible for iCloud Unlock</p>
                  <Button onClick={openCryptoModal} className="btn-primary text-white">Unlock Now</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <section className="text-center py-10">
        <h2 className="text-2xl font-bold">Contact Us</h2>
        <p className="mt-2 text-gray-600">Need help? <a href="mailto:info@icloudserver.com" className="text-blue-600 hover:underline">info@icloudserver.com</a></p>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <div className="text-2xl font-bold text-gradient mb-4 flex items-center gap-2">
                        <Cloud /> iCloud Server
                    </div>
                    <p className="text-gray-400">Professional Apple device unlocking service</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Services</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><Link href="/services" className="hover:text-white">iPhone Unlock</Link></li>
                        <li><Link href="/services" className="hover:text-white">iPad Unlock</Link></li>
                        <li><Link href="/services" className="hover:text-white">MacBook Unlock</Link></li>
                        <li><Link href="/services" className="hover:text-white">Apple Watch Unlock</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><a href="#" className="hover:text-white">Help Center</a></li>
                        <li><a href="#" className="hover:text-white">Contact Us</a></li>
                        <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Follow Us</h4>
                    <div className="flex space-x-4">
                        <a href="#" className="text-gray-400 hover:text-white"><Twitter className="text-xl" /></a>
                        <a href="#" className="text-gray-400 hover:text-white"><Facebook className="text-xl" /></a>
                        <a href="#" className="text-gray-400 hover:text-white"><Instagram className="text-xl" /></a>
                    </div>
                     <a href="https://t.me/iCloudServer" className="text-gray-400 hover:text-white inline-flex items-center mt-4">
                        Telegram
                        {telegramIconImage && (
                        <Image 
                            src={telegramIconImage.imageUrl} 
                            alt="Telegram" 
                            width={18} 
                            height={18}
                            className="ml-2"
                            data-ai-hint="telegram logo"
                        />)}
                    </a>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                 <p>
                    <a href="/terms">Terms & Conditions</a> |
                    <a href="/privacy">Privacy Policy</a> |
                    <a href="/reviews">Reviews</a> |
                    <a href="/contact">Contact Us</a> |
                    <a href="/faq">FAQ</a>
                </p>
                <p className="mt-4">&copy; 2025 iCloud Server. All rights reserved.</p>
            </div>
        </div>
      </footer>
      
      <Dialog open={isCryptoModalOpen} onOpenChange={setCryptoModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Pay with Crypto</DialogTitle>
            </DialogHeader>
            {!showPaymentDetails && (
                <DialogDescription className='text-destructive font-semibold'>
                    ⚠️ No balance in account
                </DialogDescription>
            )}
            {showPaymentDetails && (
                <div className="space-y-3 animate-fade-in">
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
            )}
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setCryptoModalOpen(false)}>Close</Button>
                <Button onClick={handleMarkAsPaid} disabled={!showPaymentDetails} className="btn-primary text-white">I Paid</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
           <div className="spinner w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
           <p className="font-semibold text-gray-600">Checking account balance...</p>
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

    