
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useCollection, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages, getImage } from '@/lib/placeholder-images';
import { LoginButton } from '@/components/login-button';
import { where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Copy, Menu, RefreshCw, AlertCircle, Loader, ChevronDown, ChevronUp, MessageSquare, Ticket } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Order {
  id: string;
  orderId: string;
  createdAt: { toDate: () => Date };
  model: string;
  imei: string;
  status: 'confirming_payment' | 'approved' | 'declined' | 'processing' | 'unlocked' | 'ready_for_activation_bulk' | 'ready_for_activation';
  price: number;
}

interface UserProfile {
    id: string;
    balance?: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_review' | 'replied' | 'resolved' | 'closed';
  createdAt: { toDate: () => Date };
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

function MyAccountContent() {
  const { data: user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const orderConstraints = useMemo(() => {
    if (!user) return undefined;
    return [where('userId', '==', user.uid)];
  }, [user]);

  const { data: orders, loading: ordersLoading } = useCollection<Order>(
    'orders',
    { constraints: orderConstraints }
  );

  const ticketConstraints = useMemo(() => {
    if (!user) return undefined;
    return [where('userId', '==', user.uid)];
  }, [user]);

  const { data: tickets, loading: ticketsLoading } = useCollection<SupportTicket>(
    'tickets',
    { constraints: ticketConstraints }
  );
  
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || ' ');
  
  const [isBulkPayModalOpen, setIsBulkPayModalOpen] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkPaid, setBulkPaid] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login?redirect=/my-account');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBulkPayModalOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isBulkPayModalOpen) {
      setIsBulkPayModalOpen(false);
      toast({
        title: "Payment window expired",
        description: "Please try again.",
        variant: "destructive",
      });
    }

    return () => clearInterval(timer);
  }, [isBulkPayModalOpen, timeLeft, toast]);

  const handleOpenBulkModal = () => {
    setTimeLeft(20 * 60);
    setIsBulkPayModalOpen(true);
  };
  
  const ordersForBulkPay = orders?.filter(order => order.status === 'confirming_payment') || [];
  const canPayBulk = ordersForBulkPay.length > 1 && !bulkPaid;
  const bulkTotal = ordersForBulkPay.reduce((acc, order) => acc + order.price, 0);
  const bulkDiscount = bulkTotal * 0.2;
  const bulkFinalTotal = bulkTotal - bulkDiscount;
  
  const currentBalance = userProfile?.balance || 0;
  const bulkAmountToPay = Math.max(0, bulkFinalTotal - currentBalance);


  const handleBulkPaid = () => {
    if (isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    setTimeout(() => {
        setIsBulkPayModalOpen(false);
        setBulkPaid(true);
        setIsSubmittingBulk(false);
        alert('Bulk payment notification sent to administrator.');
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatStatus = (status: string) => {
    if (status === 'ready_for_activation_bulk') return 'Ready for activation (bulk)';
    if (status === 'ready_for_activation') return 'Ready for activation';
    return status.replace(/_/g, ' ');
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'approved':
      case 'unlocked':
        return 'secondary';
      case 'declined':
      case 'closed':
        return 'destructive';
      case 'replied':
        return 'default';
      default:
        return 'outline';
    }
  };

  const usdtImage = getImage('usdt-icon');
  const telegramIcon = getImage('telegram-icon');
  const whatsappIcon = getImage('whatsapp-icon');
  
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  if (userLoading || !user || profileLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
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
                  <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-primary">My Account</Link>
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

      <main className="flex-grow max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full">
        <h1 className="text-4xl font-bold text-center mb-10">Your Account</h1>
        
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-2xl text-blue-600">Account Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p><strong>Current Balance:</strong> ${userProfile?.balance?.toFixed(2) || '0.00'}</p>
                            <p><strong>Total Orders:</strong> {orders ? orders.length : 0}</p>
                        </div>
                        <div>
                            <p><strong>Deposit via Crypto:</strong></p>
                            <div className="flex items-center gap-3 mt-2">
                               {usdtImage && (
                                 <Image 
                                    src={usdtImage.imageUrl} 
                                    alt="USDT" 
                                    width={42} 
                                    height={42} 
                                    className="rounded-full"
                                    data-ai-hint="usdt logo"
                                 />
                               )}
                               <div>
                                 <p className="text-sm">USDT BEP20 Address:</p>
                                 <p className="font-mono text-xs bg-gray-100 p-2 rounded-md break-all">0x04bF65223Aa01924691773101FF250E4Fc6903c3</p>
                               </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <MessageSquare className="text-blue-600" />
                        Need Help?
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">If you have any issues with your order, payment, or activation, please submit a support ticket.</p>
                    <Link href="/my-account/tickets/new" className="w-full">
                        <Button className="w-full btn-primary text-white">
                            <Ticket className="mr-2 h-4 w-4" />
                            Submit Support Ticket
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>

        <Alert className="mb-12">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
                After depositing, please refresh the page to confirm that your current balance has been updated and your unlock order has been approved for processing. If you experience any issues, please contact Support.
            </AlertDescription>
        </Alert>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Order History</h2>
            <div className="flex items-center gap-4">
                 {canPayBulk && (
                    <Button onClick={handleOpenBulkModal} className="btn-primary text-white">
                        Pay Bulk ({ordersForBulkPay.length} items)
                    </Button>
                )}
                 <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 hidden md:block">Click the refresh button to update your order status.</p>
                    <Button variant="outline" onClick={() => router.refresh()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>
          </div>
          {ordersLoading ? (
            <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-lg">
                <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : orders && orders.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>{order.createdAt.toDate().toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                      <TableCell>iCloud Unlock</TableCell>
                      <TableCell>{order.model}</TableCell>
                      <TableCell className="font-mono text-xs">{order.imei}</TableCell>
                      <TableCell>
                        <Badge variant={
                            order.status === 'approved' || order.status === 'unlocked' ? 'secondary' : 
                            order.status === 'declined' ? 'destructive' : 'default'
                        } className={order.status === 'confirming_payment' || order.status === 'processing' ? 'animate-pulse' : ''}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>${order.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-lg">
                <p className="text-gray-600">No orders found. Once you make a payment for a service, your orders will appear here.</p>
            </div>
          )}
        </section>

        <section>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">My Support Tickets</h2>
                <Link href="/my-account/tickets/new">
                    <Button variant="outline" size="sm">New Ticket</Button>
                </Link>
            </div>
            {ticketsLoading ? (
                <p>Loading tickets...</p>
            ) : tickets && tickets.length > 0 ? (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Ticket ID</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()).map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell>{ticket.createdAt.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell className="font-mono text-xs uppercase">{ticket.id.slice(0, 8)}</TableCell>
                                    <TableCell>{ticket.category}</TableCell>
                                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(ticket.status)}>
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/my-account/tickets/${ticket.id}`}>
                                            <Button size="sm" variant="ghost">View Details</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <div className="text-center py-12 px-6 bg-white rounded-2xl shadow-lg border border-dashed">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">You haven't submitted any support tickets yet.</p>
                </div>
            )}
        </section>
      </main>
      
      <Dialog open={isBulkPayModalOpen} onOpenChange={setIsBulkPayModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-1">
                <DialogTitle className="text-base sm:text-lg flex justify-between items-center">
                    <span>Bulk Payment (20% Off)</span>
                    {timeLeft > 0 && (
                        <span className="text-sm font-mono bg-blue-100 text-blue-800 rounded-md px-2 py-0.5">
                            {formatTime(timeLeft)}
                        </span>
                    )}
                </DialogTitle>
                <DialogDescription className="text-sm">
                    Pay for multiple orders at once and receive a discount. Send the exact amount.
                </DialogDescription>
                 <div className="text-xs bg-gray-100 p-2 rounded-md text-gray-600 space-y-1 mt-1">
                    <p className="font-semibold">Unlocking {ordersForBulkPay.length} devices:</p>
                    <ul className="list-disc list-inside text-xs leading-tight">
                        {ordersForBulkPay.map(order => (
                            <li key={order.id}>{order.model} - <span className='font-mono'>{order.imei}</span></li>
                        ))}
                    </ul>
                </div>
            </DialogHeader>
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 pt-2 pb-12 pr-2">
                  <Alert variant="default" className="bg-blue-50 border-blue-200 py-2">
                    <AlertDescription className="text-xs">
                      For other payment options, contact the <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-blue-600">admin</a>.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wider">Original Total</p>
                              <p className="line-through text-base">${bulkTotal.toFixed(2)}</p>
                          </div>
                          <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wider">Bulk Discount (20%)</p>
                              <p className="text-base font-semibold text-green-600">-${bulkDiscount.toFixed(2)}</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wider">Your Balance</p>
                              <p className="text-base font-semibold text-green-600">-${currentBalance.toFixed(2)}</p>
                          </div>
                          <div>
                          </div>
                      </div>
                      <Separator className="my-1" />
                      <div className="text-center">
                          <p className="text-gray-500 text-xs uppercase tracking-wider">Amount to Pay</p>
                          <p className="text-2xl font-bold">${bulkAmountToPay.toFixed(2)}</p>
                      </div>
                  </div>
                  
                  {bulkAmountToPay > 0 && (
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
                  )}

                  {bulkAmountToPay <= 0 && (
                    <div className="text-center p-3 bg-green-100 text-green-800 rounded-lg">
                        <p className="font-semibold text-sm">Your balance covers the full amount!</p>
                        <p className="text-xs">Click "Confirm" to use your balance for this bulk order.</p>
                    </div>
                  )}

                  <div className="text-xs text-center text-gray-500 bg-yellow-100 text-yellow-800 p-2 rounded-md">
                      Payments made within the timer will be automatically applied.
                  </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-4 pt-2 border-t mt-auto">
                <div className="flex flex-row justify-end gap-3 w-full">
                    <Button variant="outline" className="flex-1 h-10 text-sm" onClick={() => setIsBulkPayModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleBulkPaid} className="btn-primary text-white flex-1 h-10 text-sm" disabled={isSubmittingBulk}>
                      {isSubmittingBulk ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                      ) : (
                        bulkAmountToPay > 0 ? 'Paid' : 'Confirm'
                      )}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>


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
    </div>
  );
}


export default function MyAccountPage() {
    return <MyAccountContent />
}
