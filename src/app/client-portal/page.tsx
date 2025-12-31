
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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirebase, useDoc } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, runTransaction, query, where, getDocs, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Copy, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Define the structure for a submission
interface Submission {
  id: string;
  model: string;
  price: number;
  image: string;
  imei: string;
  status: 'waiting' | 'eligible' | 'not_supported' | 'paid' | 'feedback';
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


  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing payment...');
  const [isChecking, setIsChecking] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20 * 60);

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
  };

  useEffect(() => {
    // When the model from URL changes, we should clear everything
    // to avoid showing a submission for a different device.
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
        setValidationError('Maximum Free Checks Reached\n\nYou have submitted multiple IMEI or serial number checks without placing an unlock order. Your free check limit has been reached.\n\nIf you would like to proceed with unlocking a device, please contact Admin to have your account reset.');
        return;
    }

    setValidationError(null);
    setIsChecking(true);

    const trimmedImei = imei.trim();
    const isImeiValid = /^\d{15}$/.test(trimmedImei);
    const isSerialValid = /^[a-zA-Z0-9]{10,13}$/.test(trimmedImei);

    if (!isImeiValid && !isSerialValid) {
        setTimeout(() => {
            setIsChecking(false);
            setValidationError('Enter Valid IMEI or Serial');
            setImei('');
        }, 2000);
        return;
    }

    // Check for existing submission.
    try {
      const submissionsRef = collection(firestore, 'submissions');
      const q = query(
        submissionsRef,
        where('imei', '==', trimmedImei),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data() as Submission;

        // If status is eligible, check if the model matches
        if (existingData.status === 'eligible') {
          if (existingData.model !== model) {
            setIsChecking(false);
            setValidationError('This IMEI/Serial is already eligible for unlock with a different device model. Please select the correct model to proceed.');
            return;
          }
        }
        
        // For other statuses or matching eligible model, load the existing submission
        if (existingData.status !== 'feedback') {
             setImei(existingData.imei);
             setSubmissionId(existingDoc.id);
             setIsChecking(false);
             return;
        }
        // If status is 'feedback', fall through to create a new submission
      }
    } catch (e) {
        console.error("Error querying existing submissions: ", e);
        // Fall through to creating a new one if query fails
    }


    const newSubmission = {
      userId: user.uid,
      model,
      price,
      image,
      imei: trimmedImei,
      status: 'waiting' as 'waiting',
      feedback: null,
      createdAt: serverTimestamp(),
    };
    
    addDoc(collection(firestore, 'submissions'), newSubmission)
      .then(docRef => {
        setSubmissionId(docRef.id);
        setIsChecking(false);
      })
      .catch(async (serverError) => {
        setIsChecking(false);
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
    setTimeLeft(20 * 60); // Reset timer
    setIsLoading(true);
    setLoadingMessage('Processing payment...');

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
    if (!submissionId || !submission || !user) return alert('No submission selected.');

    try {
        const newOrderId = await runTransaction(firestore, async (transaction) => {
            const counterRef = doc(firestore, 'counters', 'metrics');
            const counterDoc = await transaction.get(counterRef);

            if (!counterDoc.exists()) {
                throw "Counter document does not exist!";
            }

            const newOrderCount = (counterDoc.data().orderCounter || 0) + 1;
            const formattedOrderId = `#${7892 + newOrderCount}`;

            const newOrderRef = doc(collection(firestore, 'orders'));
            
            const newOrderData = {
                orderId: formattedOrderId,
                userId: user.uid,
                submissionId: submissionId,
                imei: submission.imei,
                model: submission.model,
                price: submission.price,
                status: 'confirming_payment' as const,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            transaction.set(newOrderRef, newOrderData);
            transaction.update(counterRef, { orderCounter: newOrderCount });
            
            return formattedOrderId;
        });

        setPaymentModalOpen(false);
        alert(`Payment submitted for confirmation. Your Order ID is: ${newOrderId}. You will be redirected to your account page.`);
        if (typeof window !== 'undefined') {
          window.location.assign('/my-account');
        }

    } catch (e: any) {
        console.error("Transaction failed: ", e);
        
        // Emit a generic error because we don't have fine-grained context inside a transaction
        const permissionError = new FirestorePermissionError({
          path: `orders/unknown or counters/metrics`,
          operation: 'write',
          requestResourceData: { note: 'Transaction failed', error: e.message },
        });
        errorEmitter.emit('permission-error', permissionError);
        alert('Failed to create order. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const telegramIconImage = PlaceHolderImages.find(img => img.id === 'telegram-icon');
  const usdtImage = PlaceHolderImages.find(img => img.id === 'usdt-icon');
  const usdtTrc20Image = PlaceHolderImages.find(img => img.id === 'usdt-trc20-icon');
  const bitcoinImage = PlaceHolderImages.find(img => img.id === 'bitcoin-icon');
  
  const currentBalance = userProfile?.balance || 0;
  const amountToPay = Math.max(0, price - currentBalance);

  if (userLoading || !user || profileLoading || bannedUserLoading) {
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

      <main className="max-w-4xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
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
                disabled={!!submission || isChecking}
              />
              <div className="flex gap-3">
                <Button onClick={handleSubmitImei} className="btn-primary text-white" disabled={!!submission || isChecking}>Submit</Button>
                <Button onClick={handleClear} variant="outline">Clear</Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              The server will run checks on the submitted IMEI or serial number and return the results on this page. Please do not close the page until the feedback loads. You may minimize the page while waiting.
            </p>
          </div>
        </div>

        <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[120px] flex items-center justify-center flex-col text-center">
          {isChecking && (
             <div className="flex flex-col items-center">
              <div className="spinner w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="font-semibold">Wait for results...</p>
            </div>
          )}
          {!isChecking && validationError && (
              <div className="w-full text-left">
                  <div className="p-2 px-3 rounded-md bg-red-100 border border-red-200 text-sm whitespace-pre-wrap font-mono text-red-800">
                    {validationError}
                  </div>
              </div>
          )}
          {!isChecking && !validationError && !submissionId && !submissionLoading && (
            <div>
              <p className="font-semibold text-gray-700">No IMEI submitted yet.</p>
              <p className="text-sm text-gray-500">Submit your IMEI or serial number to check if unlock is supported.</p>
            </div>
          )}
          {!isChecking && !validationError && submissionLoading && (
             <div className="flex flex-col items-center">
              <div className="spinner w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="font-semibold">Loading submission...</p>
            </div>
          )}
          {!isChecking && !validationError && submission && submission.status === 'waiting' && (
            <div className="flex flex-col items-center">
              <div className="spinner w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="font-semibold">Wait for results...</p>
              <p className="text-sm text-gray-500">Server is processing your request and will send the feedback here once the checks are complete.</p>
            </div>
          )}
          {!isChecking && !validationError && submission && (submission.status === 'eligible' || submission.status === 'not_supported' || submission.status === 'feedback') && (
            <div className="w-full text-left">
              <div className="space-y-2">
                {submission.feedback?.map((line, index) => {
                  if (line === 'FIND_MY_ON_STATUS') {
                    return (
                      <div key={index} className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm font-mono flex items-center gap-2">
                        <span>Find My:</span>
                        <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-md text-xs">ON</span>
                      </div>
                    )
                  }
                  return (
                    <div key={index} className="p-2 px-3 rounded-md bg-white border border-gray-200 text-sm whitespace-pre-wrap font-mono">
                      {line}
                    </div>
                  )
                })}
              </div>
              {submission.status === 'eligible' && (
                <div className="mt-4 text-right flex items-center justify-end gap-4 animate-fade-in">
                  <p className="bg-green-100 text-green-800 font-semibold p-2 px-3 rounded-lg">✅ This device is eligible for iCloud Unlock</p>
                  <Button onClick={openPaymentModal} className="btn-primary text-white">Proceed with Unlock</Button>
                </div>
              )}
               {submission.status === 'not_supported' && (
                 <p className="bg-red-100 text-red-800 font-semibold p-2 px-3 rounded-lg mt-4 text-center">❌ Unable to proceed with the unlock.</p>
               )}
               {submission.status === 'feedback' && (
                 <p className="bg-blue-100 text-blue-800 font-semibold p-2 px-3 rounded-lg mt-4 text-center">ℹ️ Select the correct device model, and check again.</p>
               )}
            </div>
          )}
           {!isChecking && !validationError && !submission && !submissionLoading && submissionId && (
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
                        <li><Link href="/unlocking-guide" className="hover:text-white">Unlocking Guide</Link></li>
                        <li><Link href="/bulk-unlock-discount" className="hover:text-white">Bulk Unlock Discont: Get 20% Off!</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Join our Telegram</h4>
                    <a href="https://t.me/iCloudUnlocks2023" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white inline-flex items-center">
                        {telegramIconImage && <Image 
                            src={telegramIconImage.imageUrl} 
                            alt="Telegram Group" 
                            width={18} 
                            height={18}
                            className="mr-2"
                        />}
                        Telegram Channel
                    </a>
                    <h4 className="font-semibold mb-4 mt-4">Contact Us</h4>
                     <a href="https.t.me/iCloudUnlocks_2023" className="text-gray-400 hover:text-white inline-flex items-center mb-2">
                        {telegramIconImage && <Image 
                             src={telegramIconImage.imageUrl} 
                            alt="Telegram" 
                            width={18} 
                            height={18}
                            className="mr-2"
                        />}
                        Contact us on Telegram
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
                <p className="mt-4">&copy; 2023 iCloud Unlocks. All rights reserved.</p>
            </div>
        </div>
      </footer>
      
      <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className='flex justify-between items-center'>
                    <span>Pay with Crypto</span>
                    {timeLeft > 0 && (
                        <span className="text-lg font-mono bg-blue-100 text-blue-800 rounded-md px-2 py-1">
                            {formatTime(timeLeft)}
                        </span>
                    )}
                </DialogTitle>
                <DialogDescription>
                    Send the exact amount to one of the addresses below.
                </DialogDescription>
            </DialogHeader>
             <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 animate-fade-in py-4 pr-6">
                    <div className="text-center">
                        <p className="text-gray-500">Service Cost</p>
                        <p className="text-lg font-semibold">${price.toFixed(2)}</p>
                        <p className="text-gray-500 mt-1">Your Balance</p>
                        <p className="text-lg font-semibold text-green-600">-${currentBalance.toFixed(2)}</p>
                        <Separator className="my-2" />
                        <p className="text-gray-500">Amount to Pay</p>
                        <p className="text-3xl font-bold">${amountToPay.toFixed(2)}</p>
                    </div>

                    {amountToPay > 0 && (
                        <>
                            {/* USDT BEP20 */}
                            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
                                <div className="flex items-center gap-3">
                                    {usdtImage && <Image src={usdtImage.imageUrl} alt="USDT BEP20" width={40} height={40} className="rounded-full" data-ai-hint="usdt logo" />}
                                    <div>
                                        <p className="font-semibold">USDT (BEP20 Network) - <span className="text-green-600 font-bold">Recommended</span></p>
                                        <p className="text-xs text-gray-500">Use Binance Smart Chain for low fees.</p>
                                    </div>
                                </div>
                                <div className="font-mono bg-gray-100 p-2 rounded-md break-all text-sm flex items-center justify-between">
                                <span>0x13283c0fb8F25845Dc2745E99C42D224e44103d9</span>
                                    <CopyToClipboard text="0x13283c0fb8F25845Dc2745E99C42D224e44103d9">
                                        <Copy className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-800"/>
                                    </CopyToClipboard>
                                </div>
                            </div>

                            {/* USDT TRC20 */}
                            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
                                <div className="flex items-center gap-3">
                                    {usdtTrc20Image && <Image src={usdtTrc20Image.imageUrl} alt="USDT TRC20" width={40} height={40} className="rounded-full" />}
                                    <div>
                                        <p className="font-semibold">USDT (TRC20 Network)</p>
                                        <p className="text-xs text-gray-500">Contact admin before sending.</p>
                                    </div>
                                </div>
                                <div className="font-mono bg-gray-100 p-2 rounded-md break-all text-sm flex items-center justify-between">
                                    <span>TLFA2iXceSQqTpPqTt7i2SYqkZzodLNvHe</span>
                                    <CopyToClipboard text="TLFA2iXceSQqTpPqTt7i2SYqkZzodLNvHe">
                                        <Copy className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-800"/>
                                    </CopyToClipboard>
                                </div>
                            </div>

                            {/* Bitcoin */}
                            <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
                                <div className="flex items-center gap-3">
                                    {bitcoinImage && <Image src={bitcoinImage.imageUrl} alt="Bitcoin" width={40} height={40} className="rounded-full" />}
                                    <div>
                                        <p className="font-semibold">Bitcoin</p>
                                        <p className="text-xs text-gray-500">Contact admin before sending.</p>
                                    </div>
                                </div>
                                <div className="font-mono bg-gray-100 p-2 rounded-md break-all text-sm flex items-center justify-between">
                                    <span>bc1qse2rp9jssde2e6e94szltjvd2ucav6e0lv7z3g</span>
                                    <CopyToClipboard text="bc1qse2rp9jssde2e6e94szltjvd2ucav6e0lv7z3g">
                                        <Copy className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-800"/>
                                    </CopyToClipboard>
                                </div>
                            </div>

                            <div className="text-xs text-center text-gray-500 bg-yellow-100 text-yellow-800 p-2 rounded-md">
                                Payments made within the timer will be automatically applied. For any issues or for payments via other methods, please contact the admin.
                            </div>
                        </>
                    )}
                     {amountToPay <= 0 && (
                        <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg">
                            <p className="font-semibold">Your balance covers the full amount!</p>
                            <p>Click "Confirm" to use your balance for this unlock.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                <Button onClick={handlePaid} className="btn-primary text-white">
                    {amountToPay > 0 ? 'I Paid' : 'Confirm'}
                </Button>
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

    