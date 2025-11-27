
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUser, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { MessageSquare } from 'lucide-react';
import { LoginButton } from '@/components/login-button';
import { where } from 'firebase/firestore';

interface Order {
  id: string;
  createdAt: { toDate: () => Date };
  model: string;
  imei: string;
  status: 'confirming_payment' | 'approved' | 'declined';
  price: number;
}

function MyAccountContent() {
  const { data: user, loading: userLoading } = useUser();
  const router = useRouter();
  
  const { data: orders, loading: ordersLoading } = useCollection<Order>(
    'orders',
    user ? { constraints: [where('userId', '==', user.uid)] } : undefined
  );

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login?redirect=/my-account');
    }
  }, [user, userLoading, router]);

  const usdtImage = PlaceHolderImages.find(img => img.id === 'usdt-icon');
  const telegramIconImage = PlaceHolderImages.find(img => img.id === 'telegram-icon');
  
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  if (userLoading || !user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 text-gray-800">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                 <Image src="https://i.postimg.cc/tCm66wrX/no-background.png" alt="iCloud Server Logo" width={150} height={40} />
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
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
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-32 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-10">Your Account</h1>
        
        <Card className="mb-12">
            <CardHeader>
                <CardTitle className="text-2xl text-blue-600">Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p><strong>Current Balance:</strong> $0.00</p>
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
                             <p className="font-mono text-xs bg-gray-100 p-2 rounded-md break-all">0x69dfEded84C7E5baAB723FF65e1C587f2E50b3f4</p>
                           </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <section>
          <h2 className="text-3xl font-bold mb-6">Order History</h2>
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
                      <TableCell>iCloud Unlock</TableCell>
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
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <Image src="https://i.postimg.cc/tCm66wrX/no-background.png" alt="iCloud Server Logo" width={150} height={40} />
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
                    <a href="https://t.me/iCloudServerGroup" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white inline-flex items-center">
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
                     <a href="https://t.me/iCloudServer" className="text-gray-400 hover:text-white inline-flex items-center mb-2">
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
                <p className="mt-4">&copy; 2025 iCloud Server. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}


export default function MyAccountPage() {
    return <MyAccountContent />
}
