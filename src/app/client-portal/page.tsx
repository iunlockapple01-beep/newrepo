
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
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
import { PlaceHolderImages, getImage } from '@/lib/placeholder-images';
import { useUser, useFirebase, useDoc } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, runTransaction, query, where, getDocs, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Copy, Menu, Loader, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VerificationAnimation } from '@/components/ui/verification-animation';
import { cn } from '@/lib/utils';
import { TypingAnimation } from '@/components/ui/typing-animation';

// Define the structure for a submission
interface Submission {
  id: string;
  model: string;
  price: number;
  image: string;
  imei: string;
  status: 'waiting' | 'eligible' | 'not_supported' | 'paid' | 'feedback' | 'find_my_off' | 'device_found';
  feedback: string[] | null;
  createdAt: any;
}

interface UserProfile {
    id: string;
    balance?: number;
}

interface BannedUser {
    id: string;
    userId: string;
    createdAt: any;
}

interface Counters {
    isServerOnline?: boolean;
}

const paymentMethods = [
    { name: 'USDT', imageUrl: 'https://i.postimg.cc/ZRTpmnTk/download_(4).png' },
    { name: 'Apple Pay', imageUrl: 'https://i.postimg.cc/G2qYmRpg/download_(6).png' },
    { name: 'Binance', imageUrl: 'https://i.postimg.cc/BQVwY9J3/binance.jpg' },
    { name: 'Visa', imageUrl: 'https://i.postimg.cc/50DfvbkH/Screenshot-2026-01-29-at-05-45-16.png' },
    { name: 'MasterCard', imageUrl: 'https://i.postimg.cc/P57tbr3p/download_(1).png' },
    { name: 'Bitcoin', imageUrl: 'https://i.postimg.cc/rwH8GFn4/download_(2).png' },
    { name: 'Ethereum', imageUrl: 'https://i.postimg.cc/0y48G2WY/download_(3).png' },
    { name: 'Skrill', imageUrl: 'https://i.postimg.cc/Z5QTPK7p/images.png' },
    { name: 'Perfect Money', imageUrl: 'https://i.postimg.cc/6pP9V5jC/images.jpg' },
    { name: 'Cash App', imageUrl: 'https://i.postimg.cc/Df6jpBcX/download.png' },
];

const verificationStepsList = [
    "Validating request and input format",
    "Normalizing device identifier (IMEI / Serial / TAC)",
    "Completing Cloudflare security verification",
    "Connecting to iCloud unlock servers",
    "Querying manufacturer and model reference database",
    "Checking device model details",
    "Checking iCloud (Find My) activation status",
    "Checking blacklist / carrier status",
    "Searching multiple secure data sources",
    "Correlating results and resolving matches",
    "Applying server-side validation rules",
    "Verifying unlock server support eligibility",
    "Finalizing compatibility check"
];

function VerificationSteps({ steps }: { steps: string[] }) {
    const [revealedStep, setRevealedStep] = useState(0);

    useEffect(() => {
        if (revealedStep < steps.length) {
            const timer = setTimeout(() => {
                setRevealedStep(prev => prev + 1);
            }, 1500); // 1.5 second delay between steps
            return () => clearTimeout(timer);
        }
    }, [revealedStep, steps.length]);

    return (
        <div className="w-full text-left p-4 md:p-6 space-y-3">
            {steps.slice(0, revealedStep).map((step, index) => (
                <div key={index} className="flex items-center gap-3 text-sm animate-fade-in">
                    {index < revealedStep - 1 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                        <Loader className="h-5 w-5 animate-spin text-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-gray-700">{step}</span>
                </div>
            ))}
        </div>
    );
}

const CopyToClipboard = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "Address has been copied.",
      duration: 2000,
    });
  };

  return (
    <div onClick={handleCopy} className="cursor-pointer">
      {children}
    </div>
  );
};

function DeviceCheckContent() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const model = searchParams.get('model') || 'Unknown Model';
  const price = Number(searchParams.get('price')) || 0;
  const image = searchParams.get('image') || '/placeholder.svg';
  const { toast } = useToast();

  const [imei, setImei] = useState('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const { data: submission, loading: submissionLoading } = useDoc<Submission>('submissions', submissionId || ' ');
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || ' ');
  const { data: bannedUser, loading: bannedUserLoading } = useDoc<BannedUser>('banned_users', user?.uid || ' ');
  const { data: counters } = useDoc<Counters>('counters', 'metrics');

  const isServerOnline = counters?.isServerOnline !== false;

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [showOtherPayments, setShowOtherPayments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing payment...');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  
  const [showDeviceFoundNotif, setShowDeviceFoundNotif] = useState(false);
  const [startVerificationSteps, setStartVerificationSteps] = useState(false);

  const [showCachedDataNotification, setShowCachedDataNotification] = useState(false);
  const [isCachedCheck, setIsCachedCheck] = useState(false);
  
  // Offline simulation state
  const [isOfflineSimulating, setIsOfflineSimulating] = useState(false);
  const [offlineError, setOfflineError] = useState(false);

  const formDisabled = isChecking || !!submission || isOfflineSimulating;
  const shouldShowLoader = (isChecking || (submission && submission.status === 'waiting') || isOfflineSimulating) && !offlineError;


  useEffect(() => {
    if (submission?.status === 'device_found') {
        setShowDeviceFoundNotif(true);
        const timer = setTimeout(() => {
            setShowDeviceFoundNotif(false);
            setStartVerificationSteps(true);
        }, 5000);
        return () => clearTimeout(timer);
    } else if (submission?.status && submission.status !== 'waiting') {
        setShowDeviceFoundNotif(false);
        setStartVerificationSteps(false);
    }
  }, [submission?.status, submission?.id]);


  const feedbackData = useMemo(() => {
    if (!submission?.feedback) return { lines: [], timestamp: null };
    const lines = submission.feedback.filter(line => !line.startsWith('TIMESTAMP:'));
    const timestampLine = submission.feedback.find(line => line.startsWith('TIMESTAMP:'));
    const timestamp = timestampLine ? timestampLine.replace('TIMESTAMP:', '') : null;
    return { lines, timestamp };
  }, [submission?.feedback]);


  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPaymentModalOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setPaymentModalOpen(false);
      toast({
        title: "Payment window expired",
        description: "Please try again.",
        variant: "destructive",
      });
    }

    return () => clearInterval(timer);
  }, [isPaymentModalOpen, timeLeft, toast]);
  
  const handleClear = () => {
    setImei('');
    setSubmissionId(null);
    setValidationError(null);
    setShowDeviceFoundNotif(false);
    setStartVerificationSteps(false);
    setShowCachedDataNotification(false);
    setIsCachedCheck(false);
    setIsOfflineSimulating(false);
    setOfflineError(false);
    setIsChecking(false);
  };

  useEffect(() => {
    handleClear();
  }, [model]);


  useEffect(() => {
    if (!userLoading && !user) {
      const redirectPath = `/client-portal?${searchParams.toString()}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [user, userLoading, router, searchParams]);
  
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  const handleSubmitImei = async () => {
    if (!user) {
      alert('Please log in to submit an IMEI.');
      return;
    }
    
    if (bannedUser) {
        setValidationError('Maximum Free Checks Reached\n\nYou have submitted multiple IMEI or serial number checks without placing an unlock order. Your free check limit has been reached.\n\nIf you would like to proceed with unlocking a device, please contact the Admin to have your account reset.');
        return;
    }

    setValidationError(null);
    setShowDeviceFoundNotif(false);
    setStartVerificationSteps(false);
    setOfflineError(false);
    
    const trimmedImei = imei.trim();
    
    const isImeiValid = /^\d{15}$/.test(trimmedImei);
    const isSerialValid = /^[a-zA-Z0-9]{10,13}$/.test(trimmedImei);
    
    if (!isImeiValid && !isSerialValid) {
        setValidationError('Enter Valid IMEI or Serial');
        return;
    }

    setIsChecking(true);

    try {
      const submissionsRef = collection(firestore, 'submissions');
      const q = query(
        submissionsRef,
        where('imei', '==', trimmedImei),
        where('status', 'in', ['eligible', 'find_my_off', 'not_supported', 'paid', 'feedback', 'device_found']),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data() as Submission;

        if (existingData.model === model) {
            setIsCachedCheck(true);
            setTimeout(() => {
                setIsChecking(false);
                setShowCachedDataNotification(true);
                setTimeout(() => {
                    setShowCachedDataNotification(false);
                    setSubmissionId(existingDoc.id);
                }, 3000); 
            }, 4000); 
            return;
        } else {
             setIsChecking(false);
             setValidationError('This IMEI/Serial is already associated with a different device model. Please select the correct model to proceed.');
             return;
        }
      }
    } catch (e) {
        console.error("Error querying existing submissions: ", e);
    }

    if (!isServerOnline) {
        setIsChecking(false);
        setIsOfflineSimulating(true);
        const newOfflineSubmission = {
            userId: user.uid,
            model,
            price,
            image,
            imei: trimmedImei,
            status: 'waiting' as const,
            feedback: null,
            createdAt: serverTimestamp(),
        };
        addDoc(collection(firestore, 'submissions'), newOfflineSubmission);

        setTimeout(() => {
            setIsOfflineSimulating(false);
            setOfflineError(true);
        }, 10000);
        return;
    }
    
    const message = `🚨 <b>New Device Check Submitted!</b> 🚀\n\n<b>Model:</b> ${model}\n<b>IMEI/Serial:</b> ${trimmedImei}\n<b>User ID:</b> ${user.uid}`;
    try {
      fetch('/api/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }

    const newSubmission = {
      userId: user.uid,
      model,
      price,
      image,
      imei: trimmedImei,
      status: 'waiting' as const,
      feedback: null,
      createdAt: serverTimestamp(),
    };
    
    addDoc(collection(firestore, 'submissions'), newSubmission)
      .then(async (docRef) => {
        setSubmissionId(docRef.id);
        setIsChecking(false);
      })
      .catch(async (serverError) => {
        setIsChecking(false);
        const permissionError = new FirestorePermissionError({
          path: `submissions/unknown`,
          operation: 'create',
          requestResourceData: newSubmission,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Error creating submission: ", serverError);
        alert('Failed to create submission.');
      });
  };

  const openPaymentModal = () => {
    setTimeLeft(20 * 60);
    setIsLoading(true);
    setLoadingMessage('Processing payment...');
    setShowOtherPayments(false);

    setTimeout(() => {
      setLoadingMessage('Checking account balance...');
      setTimeout(() => {
        setLoadingMessage('No enough balance. Proceeding with payment details...');
        setTimeout(() => {
          setIsLoading(false);
          setPaymentModalOpen(true);
        }, 3000);
      }, 2000);
    }, 2000);
  };
  
  const handlePaid = async () => {
    if (isSubmittingOrder) return;
    if (!submissionId || !submission || !user) return alert('No submission selected.');

    setIsSubmittingOrder(true);

    const generateRandomPart = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const newOrderId = `#ORD-${generateRandomPart(5)}`;

    try {
      const newOrderData = {
        orderId: newOrderId,
        userId: user.uid,
        submissionId: submissionId,
        imei: submission.imei,
        model: submission.model,
        price: submission.price,
        status: 'confirming_payment' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ordersCollectionRef = collection(firestore, 'orders');
      await addDoc(ordersCollectionRef, newOrderData);

      setPaymentModalOpen(false);
      alert(`Payment submitted for confirmation. Your Order ID is: ${newOrderId}. You will be redirected to your account page.`);
      if (typeof window !== 'undefined') {
        window.location.assign('/my-account');
      }

    } catch (e: any) {
      console.error("Order creation failed: ", e);
      const permissionError = new FirestorePermissionError({
        path: 'orders',
        operation: 'create',
        requestResourceData: { orderId: newOrderId, note: 'Failed to create order' },
      });
      errorEmitter.emit('permission-error', permissionError);
      alert('Failed to create order. Please try again.');
      setIsSubmittingOrder(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const telegramIcon = getImage('telegram-icon');
  const whatsappIcon = getImage('whatsapp-icon');
  const usdtImage = getImage('usdt-icon');
  const usdtTrc20Image = getImage('usdt-trc20-icon');
  const bitcoinImage = getImage('bitcoin-icon');
  const usdcImage = getImage('usdc-icon');
  const ethImage = getImage('eth-icon');
  
  const currentBalance = userProfile?.balance || 0;
  const amountToPay = Math.max(0, price - currentBalance);

  if (userLoading || !user || profileLoading || bannedUserLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <div>Loading...</div>
        </div>
    );
  }
  
  const renderContent = () => {
    if (validationError) {
      return (
          <div className="w-full text-left p-4">
              <div className="p-2 px-3 rounded-md bg-red-100 border border-red-200 text-sm whitespace-pre-wrap font-mono text-red-800">
                {validationError}
              </div>
          </div>
      );
    }

    if (offlineError) {
        return (
            <div className="w-full max-w-2xl mx-auto p-6 text-center animate-blink-slow">
                <div className="flex justify-center mb-4">
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Device Check Failed</h3>
                <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                    <p>We are currently unable to complete your IMEI / Serial device check. One or more device check servers may be temporarily offline or experiencing high traffic volume.</p>
                    <p>Please try again shortly. Our system will automatically resume full compatibility validation once the server connection is restored.</p>
                    <p className="font-semibold">We appreciate your patience.</p>
                </div>
            </div>
        );
    }
    
    if (shouldShowLoader) {
      return <VerificationAnimation />;
    }

    if (showCachedDataNotification) {
      return (
        <div className="flex flex-col items-center justify-center h-full animate-pop-in">
          <CheckCircle2 className="w-24 h-24 text-blue-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 text-center px-4">Device data already in the database</h2>
          <div className="flex items-center gap-3 mt-4">
            <Loader className="h-6 w-6 animate-spin text-blue-500" />
            <p className="text-lg text-gray-600">Loading existing information...</p>
          </div>
        </div>
      );
    }

    if (!submissionId) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="font-semibold text-gray-700">No IMEI submitted yet.</p>
              <p className="text-sm text-gray-500">Submit your IMEI or serial number to check if unlock is supported.</p>
            </div>
        );
    }
    if (!submission && submissionId && !submissionLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="font-semibold text-destructive">This submission was not found.</p>
              <p className="text-sm text-gray-500">It may have been deleted by an administrator. Please clear and try again.</p>
            </div>
        );
    }

    if (submission?.status === 'device_found') {
        if (showDeviceFoundNotif) {
            return (
                <div className="flex flex-col items-center justify-center h-full animate-pop-in">
                    <CheckCircle2 className="w-24 h-24 text-green-500 mb-4" />
                    <p className="text-3xl font-bold text-gray-800">Device Found</p>
                </div>
            );
        }
        if (startVerificationSteps) {
          return <VerificationSteps steps={verificationStepsList} />;
        }
    }

    if (submission && ['eligible', 'not_supported', 'feedback', 'find_my_off'].includes(submission.status)) {
        const specialStatusLines = feedbackData.lines.filter(line => line === 'FIND_MY_ON_STATUS' || line === 'FIND_MY_OFF_STATUS');
        const feedbackText = feedbackData.lines.filter(line => !specialStatusLines.includes(line)).join('\n');
        
        return (
            <div className="w-full text-left p-4">
              <div className="space-y-2">
                {specialStatusLines.map((line, index) => {
                  if (line === 'FIND_MY_ON_STATUS') {
                    return (
                      <div key={`special-${index}`} className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm font-mono flex items-center gap-2">
                        <span>Find My:</span>
                        <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-md text-xs">ON</span>
                      </div>
                    )
                  }
                  if (line === 'FIND_MY_OFF_STATUS') {
                    return (
                      <div key={`special-${index}`} className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm font-mono flex items-center gap-2">
                        <span>Find My:</span>
                        <span className="bg-green-500 text-white font-bold px-2 py-0.5 rounded-md text-xs">OFF</span>
                      </div>
                    )
                  }
                  return null;
                })}

                {feedbackText && (
                  isCachedCheck ? (
                    <div className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm font-mono whitespace-pre-wrap">
                      {feedbackText}
                    </div>
                  ) : (
                    <TypingAnimation 
                        text={feedbackText} 
                        duration={5000} 
                        className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm font-mono"
                    />
                  )
                )}
              </div>
              {feedbackData.timestamp && (
                <p className="text-xs text-gray-500 mt-2 text-right">Feedback received: {feedbackData.timestamp}</p>
              )}
              {submission.status === 'eligible' && (
                <div className="mt-4 text-right flex items-center justify-end gap-4 animate-fade-in">
                  <p className="bg-green-100 text-green-800 font-semibold p-2 px-3 rounded-lg">✅ This device is eligible for iCloud Unlock</p>
                  <Button onClick={openPaymentModal} className="btn-primary text-white">Proceed with Unlock</Button>
                </div>
              )}
               {submission.status === 'not_supported' && (
                 <p className="bg-red-100 text-red-800 font-semibold p-2 px-3 rounded-lg mt-4 text-center">❌ Unable to proceed with the unlock.</p>
               )}
               {submission.status === 'find_my_off' && (
                 <p className="bg-blue-100 text-blue-800 font-semibold p-2 px-3 rounded-lg mt-4 text-center">
                    Find My is OFF. If you need help restoring your device, please contact the {' '}
                    <a href="https://t.me/Chris_Morgan057" target="_blank" rel="noopener noreferrer" className="underline font-bold">
                        technician
                    </a>.
                 </p>
               )}
               {submission.status === 'feedback' && (
                 <p className="bg-blue-100 text-blue-800 font-semibold p-2 px-3 rounded-lg mt-4 text-center">ℹ️ Select the correct device model, and check again.</p>
               )}
            </div>
        );
    }
    
    return null;
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
                        <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Admin</Link>
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
                            <Link href="/admin" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Admin</Link>
                        )}
                        <div className="pt-4">
                          <LoginButton />
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
            </div>
        </div>
      </nav>

      <main className="flex-grow max-w-4xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full">
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
                disabled={formDisabled}
              />
              <div className="flex gap-3">
                <Button onClick={handleSubmitImei} className="btn-primary text-white" disabled={formDisabled}>Submit</Button>
                <Button onClick={handleClear} variant="outline">Clear</Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              The server will run checks on the submitted IMEI or serial number and return the results on this page. Please do not close the page until the feedback loads. You may minimize the page while waiting.
            </p>
          </div>
        </div>

        <div className={cn("mt-5 rounded-lg border border-gray-200", 
            shouldShowLoader ? "bg-white overflow-hidden" : "p-4 bg-gray-50 min-h-[120px] flex items-center justify-center flex-col text-center"
        )}>
          {renderContent()}
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                        <li><Link href="/unlocking-guide" className="hover:text-white">Unlocking Guide</Link></li>
                        <li><Link href="/bulk-unlock-discount" className="hover:text-white">Bulk Unlock Discont: Get 20% Off!</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Contact Us</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li className='block'>
                            <a href="https://t.me/iUnlock_Apple1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {telegramIcon && <Image src={telegramIcon.imageUrl} alt="Telegram" width={18} height={18} className="mr-2" />}
                                Telegram Channel
                            </a>
                        </li>
                        <li className='block'>
                            <a href="https://t.me/iCloudUnlocks_2023" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {telegramIcon && <Image src={telegramIcon.imageUrl} alt="Telegram" width={18} height={18} className="mr-2" />}
                                Support 1
                            </a>
                        </li>
                        <li className='block'>
                            <a href="https://t.me/iUnlock_Apple" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {telegramIcon && <Image src={telegramIcon.imageUrl} alt="Telegram" width={18} height={18} className="mr-2" />}
                                Support 2
                            </a>
                        </li>
                        <li className='block'>
                            <a href="https://t.me/Chris_Morgan057" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {telegramIcon && <Image src={telegramIcon.imageUrl} alt="Telegram" width={18} height={18} className="mr-2" />}
                                Technician
                            </a>
                        </li>
                        <li className='block'>
                           <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {whatsappIcon && <Image src={whatsappIcon.imageUrl} alt="WhatsApp" width={18} height={18} className="mr-2" />}
                                WhatsApp
                            </a>
                        </li>
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold mb-4">Accepted Payments</h4>
                    <div className="flex flex-wrap gap-2">
                        {paymentMethods.map(method => (
                            <div key={method.name} className="bg-white rounded-md flex items-center justify-center h-[25px] w-[40px] overflow-hidden">
                                <Image src={method.imageUrl} alt={method.name} width={40} height={25} style={{objectFit: 'contain'}} />
                            </div>
                        ))}
                    </div>
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
                <p className="mt-4">&copy; 2023 iCloud Unlocks. All rights reserved.</p>
            </div>
        </div>
      </footer>
      
      <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-2">
                <DialogTitle className='flex justify-between items-center text-base sm:text-lg'>
                    <span>Pay with Crypto</span>
                    {timeLeft > 0 && (
                        <span className="text-sm font-mono bg-blue-100 text-blue-800 rounded-md px-2 py-0.5">
                            {formatTime(timeLeft)}
                        </span>
                    )}
                </DialogTitle>
                <DialogDescription className="text-sm">
                   Pay unlock fees for this device. Send the exact crypto amount.
                </DialogDescription>
                 {submission && (
                    <div className="text-xs bg-gray-100 p-2 rounded-md text-gray-600 mt-1">
                        <p><strong>Model:</strong> {submission.model} | <strong>IMEI/Serial:</strong> {submission.imei}</p>
                    </div>
                )}
            </DialogHeader>
             <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 animate-fade-in pt-2 pb-32">
                    <Alert variant="default" className="bg-blue-50 border-blue-200 py-2">
                      <AlertDescription className="text-xs">
                        For other payment options, contact the <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-blue-600">admin</a>.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wider">Service Cost</p>
                                <p className="text-base font-semibold">${price.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wider">Your Balance</p>
                                <p className="text-base font-semibold text-green-600">-${currentBalance.toFixed(2)}</p>
                            </div>
                        </div>
                        <Separator className="my-1" />
                        <div className="text-center">
                            <p className="text-gray-500 text-xs uppercase tracking-wider">Amount to Pay</p>
                            <p className="text-2xl font-bold">${amountToPay.toFixed(2)}</p>
                        </div>
                    </div>

                    {amountToPay > 0 && (
                        <>
                            {/* USDT BEP20 */}
                            <div className="p-3 border rounded-lg bg-gray-50 space-y-2">
                                <div className="flex items-center gap-3">
                                    {usdtImage && <Image src={usdtImage.imageUrl} alt="USDT BEP20" width={32} height={32} className="rounded-full" data-ai-hint="usdt logo" />}
                                    <div>
                                        <p className="font-semibold text-sm">USDT (BEP20 Network) - <span className="text-green-600 font-bold">Recommended</span></p>
                                        <p className="text-xs text-gray-500 leading-tight">Use Binance Smart Chain for low fees.</p>
                                    </div>
                                </div>
                                <div className="font-mono bg-gray-100 p-2 rounded-md break-all text-sm flex items-center justify-between">
                                <span>0x04bF65223Aa01924691773101FF250E4Fc6903c3</span>
                                    <CopyToClipboard text="0x04bF65223Aa01924691773101FF250E4Fc6903c3">
                                        <Copy className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-800"/>
                                    </CopyToClipboard>
                                </div>
                            </div>

                            {!showOtherPayments ? (
                                <Button 
                                    variant="outline" 
                                    className="w-full text-xs h-8 text-gray-500 flex items-center justify-center gap-2" 
                                    onClick={() => setShowOtherPayments(true)}
                                >
                                    <span>Show Other Payment Methods</span>
                                    <ChevronDown size={14} />
                                </Button>
                            ) : (
                                <div className="space-y-4 animate-fade-in pb-2">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alternative Methods</p>
                                        <Button variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowOtherPayments(false)}>
                                            <ChevronUp size={12} className="mr-1" /> Hide
                                        </Button>
                                    </div>
                                    
                                    <div className="text-xs text-blue-600 font-medium mb-1 px-1">More payment options below:</div>
                                    <div className="max-h-[280px] overflow-y-auto space-y-3 p-2 border rounded-md bg-gray-50/50">
                                        {/* USDT TRC20 */}
                                        <div className="p-3 border rounded-lg bg-white space-y-2">
                                            <div className="flex items-center gap-3">
                                                {usdtTrc20Image && <Image src={usdtTrc20Image.imageUrl} alt="USDT TRC20" width={32} height={32} className="rounded-full" />}
                                                <div>
                                                    <p className="font-semibold text-sm">USDT (TRC20 Network)</p>
                                                    <p className="text-xs text-gray-500">Contact admin before sending.</p>
                                                </div>
                                            </div>
                                            <div className="font-mono bg-gray-100 p-2 rounded-md break-all text-sm flex items-center justify-between">
                                                <span>TL5qvz8Jb82QvMMfKkNXDwMu6SrZfKg1kw</span>
                                                <CopyToClipboard text="TL5qvz8Jb82QvMMfKkNXDwMu6SrZfKg1kw">
                                                    <Copy className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-800"/>
                                                </CopyToClipboard>
                                            </div>
                                        </div>

                                        {/* USDC ERC20 */}
                                        <div className="p-3 border rounded-lg bg-white space-y-2">
                                            <div className="flex items-center gap-3">
                                                {usdcImage && <Image src={usdcImage.imageUrl} alt="USDC ERC20" width={32} height={32} className="rounded-full" />}
                                                <div>
                                                    <p className="font-semibold text-sm">USDC (ERC20 Network)</p>
                                                    <p className="text-xs text-gray-500">Fast & Secure Ethereum network.</p>
                                                </div>
                                            </div>
                                            <div className="font-mono bg-gray-100 p-2 rounded-md break-all text-sm flex items-center justify-between">
                                                <span>0x04bF65223Aa01924691773101FF250E4Fc6903c3</span>
                                                <CopyToClipboard text="0x04bF65223Aa01924691773101FF250E4Fc6903c3">
                                                    <Copy className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-800"/>
                                                </CopyToClipboard>
                                            </div>
                                        </div>

                                        {/* Ethereum ERC20 */}
                                        <div className="p-3 border rounded-lg bg-white space-y-2">
                                            <div className="flex items-center gap-3">
                                                {ethImage && <Image src={ethImage.imageUrl} alt="Ethereum ERC20" width={32} height={32} className="rounded-full" />}
                                                <div>
                                                    <p className="font-semibold text-sm">Ethereum (ERC20 Network)</p>
                                                    <p className="text-xs text-gray-500">Official Ethereum mainnet.</p>
                                                </div>
                                            </div>
                                            <div className="font-mono bg-gray-100 p-2 rounded-md break-all text-sm flex items-center justify-between">
                                                <span>0x04bF65223Aa01924691773101FF250E4Fc6903c3</span>
                                                <CopyToClipboard text="0x04bF65223Aa01924691773101FF250E4Fc6903c3">
                                                    <Copy className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-800"/>
                                                </CopyToClipboard>
                                            </div>
                                        </div>

                                        {/* Bitcoin */}
                                        <div className="p-3 border rounded-lg bg-white space-y-2">
                                            <div className="flex items-center gap-3">
                                                {bitcoinImage && <Image src={bitcoinImage.imageUrl} alt="Bitcoin" width={32} height={32} className="rounded-full" />}
                                                <div>
                                                    <p className="font-semibold text-sm">Bitcoin</p>
                                                    <p className="text-xs text-gray-500">Contact admin before sending.</p>
                                                </div>
                                            </div>
                                            <div className="font-mono bg-gray-100 p-2 rounded-md break-all text-sm flex items-center justify-between">
                                                <span>bc1qtluc3xw76uwa0wf0klmvuvf5plwe6vxas0es2h</span>
                                                <CopyToClipboard text="bc1qtluc3xw76uwa0wf0klmvuvf5plwe6vxas0es2h">
                                                    <Copy className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-800"/>
                                                </CopyToClipboard>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="text-xs text-center text-gray-500 bg-yellow-100 text-yellow-800 p-2 rounded-md">
                                Payments made within the timer will be automatically applied.
                            </div>
                        </>
                    )}
                     {amountToPay <= 0 && (
                        <div className="text-center p-3 bg-green-100 text-green-800 rounded-lg">
                            <p className="font-semibold text-sm">Your balance covers the full amount!</p>
                            <p className="text-xs">Click "Confirm" to use your balance for this unlock.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="p-4 pt-2 border-t mt-auto">
                <div className="flex flex-row justify-end gap-3 w-full">
                    <Button variant="outline" className="flex-1 h-10 text-sm" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                    <Button onClick={handlePaid} className="btn-primary text-white flex-1 h-10 text-sm" disabled={isSubmittingOrder}>
                        {isSubmittingOrder ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            amountToPay > 0 ? 'I Paid' : 'Confirm'
                        )}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
           <div className="spinner w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
           <p className="font-semibold text-gray-600">{loadingMessage}</p>
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
