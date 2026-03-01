
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = ["Refund Request", "Order Issue", "Activation Delay", "Payment Inquiry", "Other"];

export default function NewTicketPage() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [category, setCategory] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('none');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderConstraints = useMemo(() => {
    if (!user) return undefined;
    return [where('userId', '==', user.uid)];
  }, [user]);

  const { data: orders, loading: ordersLoading } = useCollection<any>('orders', { constraints: orderConstraints });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login?redirect=/my-account/tickets/new');
    }
  }, [user, userLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!category || !subject.trim() || !message.trim()) {
      return toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
    }

    setIsSubmitting(true);

    const ticketData = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'Client',
      category,
      orderId: orderId === 'none' ? null : orderId,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      replies: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'tickets'), ticketData);
      toast({
        title: "Ticket Submitted",
        description: "Your support ticket has been created. We will get back to you soon.",
      });
      router.push('/my-account');
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/my-account" className="text-sm font-medium hover:text-blue-600 transition-colors">My Account</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/my-account">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Submit Support Ticket</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="text-blue-600 h-5 w-5" />
              How can we help you?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={setCategory} value={category}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Related Order (Optional)</Label>
                  <Select onValueChange={setOrderId} value={orderId}>
                    <SelectTrigger id="order">
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not related to a specific order</SelectItem>
                      {!ordersLoading && orders?.map(order => (
                        <SelectItem key={order.id} value={order.orderId}>
                          {order.orderId} - {order.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="e.g., Refund for order #ORD-12345" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Detailed Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Describe your issue in detail so we can assist you better..." 
                  className="min-h-[200px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full btn-primary text-white h-12" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Ticket...
                  </>
                ) : (
                  'Submit Support Ticket'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t p-4">
            <p className="text-xs text-gray-500 text-center w-full">
              Our support team typically responds within 1-24 hours.
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
