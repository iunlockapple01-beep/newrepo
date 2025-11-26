'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Cloud, Twitter, Facebook, Instagram } from 'lucide-react';
import { LoginButton } from '@/components/login-button';

interface Order {
  id: string;
  date: string;
  service: string;
  model: string;
  status: 'pending' | 'processing' | 'complete';
  amount: number;
}

function MyAccountContent() {
  const { data: user, loading: userLoading } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login?redirect=/my-account');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
        // For demonstration, we use submissions from client portal as "orders"
        const submissions = JSON.parse(localStorage.getItem('icloud_submissions') || '[]');
        const userOrders = submissions.filter((sub: any) => sub.status === 'paid').map((sub: any) => ({
            id: sub.id.substring(0, 10),
            date: sub.paidAt || sub.createdAt,
            service: 'iCloud Unlock',
            model: sub.model,
            status: 'processing', // Or derive from your logic
            amount: sub.price,
        }));
        
        setOrders(userOrders);
        setTotalOrders(userOrders.length);
    }
  }, [user]);

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
              <Link href="/" className="text-2xl font-bold text-gradient flex items-center gap-2">
                <Cloud /> iCloud Server
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
                        <p><strong>Total Orders:</strong> {totalOrders}</p>
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
          {orders.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                      <TableCell>{order.service}</TableCell>
                      <TableCell>{order.model}</TableCell>
                      <TableCell>
                        <Badge variant={
                            order.status === 'complete' ? 'default' : 
                            order.status === 'processing' ? 'secondary' : 'destructive'
                        }>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>${order.amount.toFixed(2)}</TableCell>
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
                     <a href="https.me/iCloudServer" className="text-gray-400 hover:text-white inline-flex items-center mt-4">
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
    </div>
  );
}


export default function MyAccountPage() {
    return <MyAccountContent />
}
