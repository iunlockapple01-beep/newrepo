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
import { addDoc, collection, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Copy, Menu, Loader, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VerificationAnimation } from '@/components/ui/verification-animation';
import { cn } from '@/lib/utils';
import { TypingAnimation } from '@/components/ui/typing-animation';

// Define the structure for a submission
interface Submission {
  id: string;
  userId: string;
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
            }, 1500);
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
  const { firestore, auth } = useFirebase();
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
  
  const [isOfflineSimulating, setIsOfflineSimulating] = useState(false);
  const [offlineError, setOfflineError] = useState(false);

  const telegramIcon = getImage('telegram-icon');
  const whatsappIcon = getImage('whatsapp-icon');
  const usdtImage = getImage('usdt-icon');
  const usdtTrc20Image = getImage('usdt-trc20-icon');
  const bitcoinImage = getImage('bitcoin-icon');
  const ethereumImage = getImage('eth-icon');
  const usdcImage = getImage('usdc-icon');

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
    if (!user) return;
    
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
        where('imei', '==', trimmedImei)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Submission) }));
        
        // We only block/warn if there is a record that ALREADY HAS FEEDBACK.
        // If all existing records are 'waiting', we treat it as a new submission.
        const docsWithFeedback = existingDocs.filter(s => s.status !== 'waiting');

        const match = docsWithFeedback.find(s => s.model === model);
        
        if (match) {
            setIsCachedCheck(true);
            setTimeout(() => {
                setIsChecking(false);
                setShowCachedDataNotification(true);
                setTimeout(() => {
                    setShowCachedDataNotification(false);
                    setSubmissionId(match.id);
                }, 3000); 
            }, 4000); 
            return;
        }

        const conflict = docsWithFeedback.find(s => s.model !== model && s.status !== 'feedback');
        if (conflict) {
             setTimeout(() => {
                 setIsChecking(false);
                 setValidationError('This IMEI/Serial is already associated with a different device model. Please select the correct model to proceed.');
             }, 3500); 
             return;
        }
      }
    } catch (e) {}

    // Even if server is offline, we ALWAYS record the submission.
    const message = `🚨 <b>New Device Check Submitted!</b> 🚀\n\n<b>Model:</b> ${model}\n<b>IMEI/Serial:</b> ${trimmedImei}\n<b>User ID:</b> ${user.uid}`;
    try {
      fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
    } catch (error) {}

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
      .then((docRef) => {
        setSubmissionId(docRef.id);
        
        if (!isServerOnline) {
            // Server status is offline: keep simulation going for 10s then show error
            setIsChecking(false);
            setIsOfflineSimulating(true);
            setTimeout(() => {
                setIsOfflineSimulating(false);
                setOfflineError(true);
            }, 10000);
        } else {
            setIsChecking(false);
        }
      })
      .catch(async (serverError) => {
        setIsChecking(false);
        const permissionError = new FirestorePermissionError({
          path: 'submissions',
          operation: 'create',
          requestResourceData: newSubmission,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const openPaymentModal = async () => {
    if (!submission?.imei) return;

    setIsLoading(true);
    setLoadingMessage('Verifying status...');

    try {
      const ordersRef = collection(firestore, 'orders');
      const q = query(ordersRef, where('imei', '==', submission.imei), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setIsLoading(false);
        toast({
          title: "Order Already Submitted",
          description: "An unlock order of the device had already been submitted. Contact admin for any assistance or submit a ticket with the Order ID.",
          variant: "destructive",
          duration: 6000,
        });
        return;
      }
    } catch (err) {
      console.error("Duplicate check error:", err);
    }

    setTimeLeft(20 * 60);
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
  
  const handlePaid = () => {
    if (isSubmittingOrder) return;
    if (!submissionId || !submission || !user) return;

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
    addDoc(ordersCollectionRef, newOrderData)
      .then(() => {
        setPaymentModalOpen(false);
        toast({
          title: "Order Submitted",
          description: `Order submitted for confirmation. Your Order ID is: ${newOrderId}. You will be redirected to your account page.`,
          duration: 6000,
        });
        setTimeout(() => {
          router.push('/my-account');
        }, 2500);
      })
      .catch(async (serverError) => {
        setIsSubmittingOrder(false);
        const permissionError = new FirestorePermissionError({
          path: 'orders',
          operation: 'create',
          requestResourceData: newOrderData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentBalance = userProfile?.balance || 0;
  const amountToPay = Math.max(0, price - currentBalance);

  if (userLoading || !user || profileLoading || bannedUserLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  const renderContent = () => {
    if (validationError) {
      return (
          <div className="w-full text-left p-4">
              <div className="p-2 px-3 rounded-md bg-red-100 border border-red-200 text-sm whitespace-pre-wrap font-mono text-red-800 animate-fade-in">
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
                    <p>Please try again later. Our system will automatically resume full compatibility validation once the server connection is restored.</p>
                    <p className="font-semibold">We appreciate your patience.</p>
                </div>
            </div>
        );
    }
    
    if (shouldShowLoader) return <VerificationAnimation />;

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
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <p className="font-semibold text-gray-700">No IMEI submitted yet.</p>
              <p className="text-sm text-gray-500">Submit your IMEI or serial number to check if unlock is supported.</p>
            </div>
        );
    }
    if (!submission && submissionId && !submissionLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <p className="font-semibold text-destructive">This submission was not found.</p>
              <p className="text-sm text-gray-500">It may have been deleted by an administrator. Please clear and try again.</p>
            </div>
        );
    }

    if (submission?.status === 'device_found') {
        if (showDeviceFoundNotif) {
            return (
                <div className="flex flex-col items-center justify-center h-full animate-pop-in text-center px-6">
                    <CheckCircle2 className="w-24 h-24 text-green-500 mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Device Identified.</h2>
                    <div className="text-lg text-gray-600 flex items-center justify-center">
                        <span>Initializing unlock verification sequence</span>
                        <span className="inline-flex ml-1 font-bold">
                            <span className="animate-pulse">.</span>
                            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                            <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                        </span>
                    </div>
                </div>
            );
        }
        if (startVerificationSteps) return <VerificationSteps steps={verificationStepsList} />;
    }

    if (submission && ['eligible', 'not_supported', 'feedback', 'find_my_off'].includes(submission.status)) {
        const specialStatusLines = feedbackData.lines.filter(line => line === 'FIND_MY_ON_STATUS' || line === 'FIND_MY_OFF_STATUS');
        
        const feedbackText = feedbackData.lines
            .filter(line => !specialStatusLines.includes(line))
            .map(line => line
                .replace(/undefined/gi, '')
                .replace(/\(undefined\)/gi, '')
                .replace(/(iPhone)(\d+)/gi, '$1 $2')
                .trim()
            )
            .filter(line => line !== '')
            .join('\n');
        
        return (
            <div className="w-full text-left p-4">
              <div className="space-y-2">
                {specialStatusLines.map((line, index) => {
                  if (line === 'FIND_MY_ON_STATUS') {
                    return (
                      <div key={`special-${index}`} className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm font-mono flex items-center gap-2 animate-fade-in">
                        <span>Find My:</span>
                        <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-md text-xs">ON</span>
                      </div>
                    )
                  }
                  if (line === 'FIND_MY_OFF_STATUS') {
                    return (
                      <div key={`special-${index}`} className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm font-mono flex items-center gap-2 animate-fade-in">
                        <span>Find My:</span>
                        <span className="bg-green-500 text-white font-bold px-2 py-0.5 rounded-md text-xs">OFF</span>
                      </div>
                    )
                  }
                  return null;
                })}

                {feedbackText && (
                  isCachedCheck ? (
                    <div className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm font-mono whitespace-pre-wrap animate-fade-in">
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
                <p className="text-xs text-gray-500 mt-2 text-right animate-fade-in">Feedback received: {feedbackData.timestamp}</p>
              )}
              {submission.status === 'eligible' && (
                <div className="mt-4 text-right flex items-center justify-end gap-4 animate-fade-in">
                  <p className="bg-green-100 text-green-800 font-semibold p-2 px-3 rounded-lg">✅ This device is eligible for iCloud Unlock</p>
                  <Button 
                    onClick={openPaymentModal} 
                    variant="outline" 
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all font-semibold"
                  >
                    Proceed with Unlock
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
               {submission.status === 'not_supported' && (
                 <p className="bg-red-100 text-red-800 font-semibold p-2 px-3 rounded-lg mt-4 text-center animate-fade-in">❌ Unable to proceed with the unlock.</p>
               )}
               {submission.status === 'find_my_off' && (
                 <p className="bg-blue-100 text-blue-800 font-semibold p-2 px-3 rounded-lg mt-4 text-center animate-fade-in">
                    Find My is OFF. If you need help restoring your device, please contact the {' '}
                    <a href="https://t.me/Chris_Morgan057" target="_blank" rel="noopener noreferrer" className="underline font-bold">technician</a>.
                 </p>
               )}
               {submission.status === 'feedback' && (
                 <p className="bg-blue-100 text-blue-800 font-semibold p-2 px-3 rounded-lg mt-4 text-center animate-fade-in">ℹ️ Select the above device model and check again.</p>
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
                    <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-primary">Services</Link>
                    {user && <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>}
                    {isAdmin && <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Admin</Link>}
                    <LoginButton />
                </div>
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                      </SheetHeader>
                      <div className="flex flex-col gap-4 p-4">
                        <Link href="/" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Home</Link>
                        <Link href="/services" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Services</Link>
                        {user && <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>}
                        {isAdmin && <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Admin</Link>}
                        <div className="pt-4"><LoginButton /></div>
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

        <div className={cn("mt-5 rounded-lg border border-gray-200", shouldShowLoader ? "bg-white overflow-hidden" : "p-4 bg-gray-50 min-h-[120px] flex items-center justify-center flex-col text-center")}>
          {renderContent()}
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <div className="mb-4 flex items-center gap-2"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></div>
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
                        <li><a href="https://t.me/iUnlock_Apple1" target="_blank" className="hover:text-white inline-flex items-center">{telegramIcon && <Image src={telegramIcon.imageUrl} alt="Telegram" width={18} height={18} className="mr-2" />}Telegram Channel</a></li>
                        <li><a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" className="hover:text-white inline-flex items-center">{whatsappIcon && <Image src={whatsappIcon.imageUrl} alt="WhatsApp" width={18} height={18} className="mr-2" />}WhatsApp</a></li>
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
                <p>&copy; 2023 iCloud Unlocks. All rights reserved.</p>
            </div>
        </div>
      </footer>
      
      <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className={cn("sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden transition-all duration-300", showOtherPayments && "lg:max-w-[950px]")}>
            <DialogHeader className="px-5 py-2.5 border-b bg-white">
                <DialogTitle className='flex items-center gap-3 text-base sm:text-lg pr-12'>
                    {timeLeft > 0 && <span className="text-xs sm:text-sm font-mono bg-blue-100 text-blue-800 rounded-md px-2 py-0.5">{formatTime(timeLeft)}</span>}
                    <span>Pay with Crypto</span>
                </DialogTitle>
                <DialogDescription className="text-sm">Pay unlock fees for this device. Send the exact crypto amount.</DialogDescription>
                 {submission && <div className="text-xs bg-gray-100 p-2 rounded-md text-gray-600 mt-1"><p><strong>Model:</strong> {submission.model} | <strong>IMEI/Serial:</strong> {submission.imei}</p></div>}
            </DialogHeader>
             <ScrollArea className="flex-1 px-5">
                <div className={cn("grid grid-cols-1 gap-4 pt-1 pb-4", showOtherPayments && "lg:grid-cols-2 lg:gap-8")}>
                    <div className="space-y-3 animate-fade-in">
                        <Alert variant="default" className="bg-blue-50 border-blue-200 py-1.5 mt-2">
                            <AlertDescription className="text-[11px] text-center">
                                For other payment options, contact the <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-blue-600">admin</a>.
                            </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div><p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Service Cost</p><p className="text-lg font-bold">${price.toFixed(2)}</p></div>
                                <div><p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Your Balance</p><p className="text-lg font-bold text-green-600">-${currentBalance.toFixed(2)}</p></div>
                            </div>
                            <div className="text-center bg-gray-50 py-2 rounded-xl border border-dashed">
                                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Amount to Pay</p>
                                <p className="text-3xl font-black">${amountToPay.toFixed(2)}</p>
                            </div>
                        </div>

                        {amountToPay > 0 && (
                            <>
                                <div className="px-4 py-3 border rounded-2xl bg-white shadow-sm space-y-2">
                                    <div className="flex items-center gap-3">
                                        {usdtImage && <Image src={usdtImage.imageUrl} alt="USDT" width={32} height={32} className="rounded-full" />}
                                        <div>
                                            <p className="font-bold text-sm">USDT (BEP20 Network) - <span className="text-green-600">Recommended</span></p>
                                            <p className="text-[10px] text-gray-500">Use Binance Smart Chain for low fees.</p>
                                        </div>
                                    </div>
                                    <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                                        <span className="font-medium">0x04bF65223Aa01924691773101FF250E4Fc6903c3</span>
                                        <CopyToClipboard text="0x04bF65223Aa01924691773101FF250E4Fc6903c3">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 hover:bg-gray-200">
                                                <Copy className="w-4 h-4 text-gray-500"/>
                                            </Button>
                                        </CopyToClipboard>
                                    </div>
                                </div>

                                <Button 
                                    variant="outline" 
                                    className="w-full h-10 text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center gap-2 border border-gray-200 rounded-xl transition-all font-semibold shadow-none"
                                    onClick={() => setShowOtherPayments(!showOtherPayments)}
                                >
                                    <span className="text-sm">Show Other Payment Methods</span>
                                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 text-gray-500", showOtherPayments && "rotate-180")} />
                                </Button>

                                {showOtherPayments && (
                                    <div className="lg:hidden mt-1">
                                        <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">Other Networks</h4>
                                        <ScrollArea className="h-[320px] pr-2">
                                            <div className="space-y-3 pb-[250px]">
                                                <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        {usdtTrc20Image && <Image src={usdtTrc20Image.imageUrl} alt="USDT TRC20" width={32} height={32} className="rounded-full" />}
                                                        <div>
                                                            <p className="font-bold text-sm">USDT (TRC20 Network)</p>
                                                            <p className="text-[10px] text-gray-500">Standard Tether network.</p>
                                                        </div>
                                                    </div>
                                                    <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                                                        <span>TL5qvz8Jb82QvMMfKkNXDwMu6SrZfKg1kw</span>
                                                        <CopyToClipboard text="TL5qvz8Jb82QvMMfKkNXDwMu6SrZfKg1kw">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                                <Copy className="w-4 h-4 text-gray-500"/>
                                                            </Button>
                                                        </CopyToClipboard>
                                                    </div>
                                                </div>
                                                <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        {bitcoinImage && <Image src={bitcoinImage.imageUrl} alt="Bitcoin" width={32} height={32} className="rounded-full" />}
                                                        <div>
                                                            <p className="font-bold text-sm">Bitcoin (BTC)</p>
                                                            <p className="text-[10px] text-gray-500">Standard network confirmation.</p>
                                                        </div>
                                                    </div>
                                                    <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                                                        <span>bc1qtluc3xw76uwa0wf0klmvuvf5plwe6vxas0es2h</span>
                                                        <CopyToClipboard text="bc1qtluc3xw76uwa0wf0klmvuvf5plwe6vxas0es2h">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                                <Copy className="w-4 h-4 text-gray-500"/>
                                                            </Button>
                                                        </CopyToClipboard>
                                                    </div>
                                                </div>
                                                <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        {ethereumImage && <Image src={ethereumImage.imageUrl} alt="Ethereum" width={32} height={32} className="rounded-full" />}
                                                        <div>
                                                            <p className="font-bold text-sm">Ethereum (ERC20)</p>
                                                            <p className="text-[10px] text-gray-500">Fast and secure network.</p>
                                                        </div>
                                                    </div>
                                                    <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                                                        <span>0x04bF65223Aa01924691773101FF250E4Fc6903c3</span>
                                                        <CopyToClipboard text="0x04bF65223Aa01924691773101FF250E4Fc6903c3">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                                <Copy className="w-4 h-4 text-gray-500"/>
                                                            </Button>
                                                        </CopyToClipboard>
                                                    </div>
                                                </div>
                                                <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        {usdcImage && <Image src={usdcImage.imageUrl} alt="USDC ERC20" width={32} height={32} className="rounded-full" />}
                                                        <div>
                                                            <p className="font-bold text-sm">USDC (ERC20 Network)</p>
                                                            <p className="text-[10px] text-gray-500">Fast USD stablecoin.</p>
                                                        </div>
                                                    </div>
                                                    <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                                                        <span>0x04bF65223Aa01924691773101FF250E4Fc6903c3</span>
                                                        <CopyToClipboard text="0x04bF65223Aa01924691773101FF250E4Fc6903c3">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                                <Copy className="w-4 h-4 text-gray-500"/>
                                                            </Button>
                                                        </CopyToClipboard>
                                                    </div>
                                                </div>
                                            </div>
                                            <ScrollBar orientation="vertical" />
                                        </ScrollArea>
                                    </div>
                                )}

                                <Alert className="bg-yellow-50 border-yellow-100 py-2 rounded-xl">
                                    <AlertDescription className="text-[10px] text-center text-yellow-800 font-medium">
                                        Payments made within the timer will be automatically applied.
                                    </AlertDescription>
                                </Alert>
                            </>)}
                        {amountToPay <= 0 && <div className="text-center p-6 bg-green-50 border border-green-100 text-green-800 rounded-2xl animate-fade-in"><CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500"/><p className="font-bold text-base">Your balance covers the full amount!</p><p className="text-xs opacity-80">Click "Confirm" to use your balance for this unlock.</p></div>}
                    </div>

                    {/* Desktop/Landscape Wide View Sidebar */}
                    {showOtherPayments && (
                        <div className="hidden lg:block space-y-3 animate-fade-in border-l pl-8">
                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">Other Networks</h4>
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-3 pb-8">
                                    <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-3">
                                        <div className="flex items-center gap-3">
                                            {usdtTrc20Image && <Image src={usdtTrc20Image.imageUrl} alt="USDT TRC20" width={32} height={32} className="rounded-full" />}
                                            <div>
                                                <p className="font-bold text-sm">USDT (TRC20 Network)</p>
                                                <p className="text-[10px] text-gray-500">Standard Tether network.</p>
                                            </div>
                                        </div>
                                        <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                                            <span>TL5qvz8Jb82QvMMfKkNXDwMu6SrZfKg1kw</span>
                                            <CopyToClipboard text="TL5qvz8Jb82QvMMfKkNXDwMu6SrZfKg1kw">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                    <Copy className="w-4 h-4 text-gray-500"/>
                                                </Button>
                                            </CopyToClipboard>
                                        </div>
                                    </div>
                                    <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-3">
                                        <div className="flex items-center gap-3">
                                            {bitcoinImage && <Image src={bitcoinImage.imageUrl} alt="Bitcoin" width={32} height={32} className="rounded-full" />}
                                            <div>
                                                <p className="font-bold text-sm">Bitcoin (BTC)</p>
                                                <p className="text-[10px] text-gray-500">Standard network confirmation.</p>
                                            </div>
                                        </div>
                                        <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                                            <span>bc1qtluc3xw76uwa0wf0klmvuvf5plwe6vxas0es2h</span>
                                            <CopyToClipboard text="bc1qtluc3xw76uwa0wf0klmvuvf5plwe6vxas0es2h">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                    <Copy className="w-4 h-4 text-gray-500"/>
                                                </Button>
                                            </CopyToClipboard>
                                        </div>
                                    </div>
                                    <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-3">
                                        <div className="flex items-center gap-3">
                                            {ethereumImage && <Image src={ethereumImage.imageUrl} alt="Ethereum" width={32} height={32} className="rounded-full" />}
                                            <div>
                                                <p className="font-bold text-sm">Ethereum (ERC20)</p>
                                                <p className="text-[10px] text-gray-500">Fast and secure network.</p>
                                            </div>
                                        </div>
                                        <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                                            <span>0x04bF65223Aa01924691773101FF250E4Fc6903c3</span>
                                            <CopyToClipboard text="0x04bF65223Aa01924691773101FF250E4Fc6903c3">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                    <Copy className="w-4 h-4 text-gray-500"/>
                                                </Button>
                                            </CopyToClipboard>
                                        </div>
                                    </div>
                                    <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-3">
                                        <div className="flex items-center gap-3">
                                            {usdcImage && <Image src={usdcImage.imageUrl} alt="USDC ERC20" width={32} height={32} className="rounded-full" />}
                                            <div>
                                                <p className="font-bold text-sm">USDC (ERC20 Network)</p>
                                                <p className="text-[10px] text-gray-500">Fast USD stablecoin.</p>
                                            </div>
                                        </div>
                                        <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                                            <span>0x04bF65223Aa01924691773101FF250E4Fc6903c3</span>
                                            <CopyToClipboard text="0x04bF65223Aa01924691773101FF250E4Fc6903c3">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                    <Copy className="w-4 h-4 text-gray-500"/>
                                                </Button>
                                            </CopyToClipboard>
                                        </div>
                                    </div>
                                </div>
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="p-3 border-t flex flex-row gap-3 mt-auto bg-gray-50">
                <Button variant="outline" className="flex-1 h-11 rounded-xl text-sm font-bold shadow-sm" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                <Button onClick={handlePaid} className="btn-primary text-white flex-1 h-11 rounded-xl text-sm font-bold shadow-md" disabled={isSubmittingOrder}>
                    {isSubmittingOrder ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Processing...</> : (amountToPay > 0 ? 'I Paid' : 'Confirm')}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isLoading && <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"><div className="spinner w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div><p className="font-semibold text-gray-600">{loadingMessage}</p></div>}
    </div>
  );
}

export default function ClientPortalPage() {
    return (<Suspense fallback={<div>Loading...</div>}><DeviceCheckContent /></Suspense>)
}
