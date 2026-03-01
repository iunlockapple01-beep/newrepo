
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirebase, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader, MessageSquare, User, ShieldCheck, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Reply {
  message: string;
  sender: 'client' | 'admin';
  createdAt: any;
}

interface SupportTicket {
  id: string;
  userId: string;
  category: string;
  orderId: string | null;
  subject: string;
  message: string;
  status: 'open' | 'in_review' | 'replied' | 'resolved' | 'closed';
  replies: Reply[];
  createdAt: any;
}

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: ticket, loading: ticketLoading } = useDoc<SupportTicket>('tickets', ticketId as string);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket?.replies]);

  const handleSendReply = () => {
    if (!user || !ticket || !replyMessage.trim()) return;

    setIsSubmitting(true);
    const ticketRef = doc(firestore, 'tickets', ticket.id);
    const newReply = {
      message: replyMessage.trim(),
      sender: 'client' as const,
      createdAt: new Date().toISOString(),
    };

    updateDoc(ticketRef, {
      replies: arrayUnion(newReply),
      status: 'open',
      updatedAt: serverTimestamp()
    })
      .then(() => {
        setReplyMessage('');
        toast({ title: "Reply Sent", description: "Added to ticket." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: ticketRef.path,
          operation: 'update',
          requestResourceData: { replies: '...', status: 'open' },
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'resolved': return 'secondary';
      case 'closed': return 'destructive';
      case 'replied': return 'default';
      default: return 'outline';
    }
  };

  if (userLoading || ticketLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!ticket) return <div className="p-8 text-center">Not found.</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></Link>
            <Link href="/my-account" className="text-sm font-medium hover:text-blue-600 transition-colors">My Account</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/my-account"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex-1">
            <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{ticket.subject}</h1><Badge variant={getStatusVariant(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge></div>
            <p className="text-sm text-gray-500">Category: {ticket.category} {ticket.orderId && `| Related Order: ${ticket.orderId}`}</p>
          </div>
        </div>

        <Card className="flex flex-col h-[70vh]">
          <CardHeader className="border-b bg-gray-50/50"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-600" />Communication History</CardTitle></CardHeader>
          <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex gap-3 max-w-[85%]">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-blue-600" /></div>
              <div className="space-y-1">
                <div className="bg-white border rounded-2xl p-4 shadow-sm"><p className="text-sm whitespace-pre-wrap">{ticket.message}</p></div>
                <p className="text-[10px] text-gray-400 px-2">{format(ticket.createdAt.toDate(), 'PPp')}</p>
              </div>
            </div>
            {ticket.replies.map((reply, index) => (
              <div key={index} className={cn("flex gap-3 max-w-[85%]", reply.sender === 'client' ? "" : "ml-auto flex-row-reverse")}>
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", reply.sender === 'client' ? "bg-blue-100" : "bg-green-100")}>{reply.sender === 'client' ? (<User className="h-4 w-4 text-blue-600" />) : (<ShieldCheck className="h-4 w-4 text-green-600" />)}</div>
                <div className={cn("space-y-1", reply.sender === 'client' ? "" : "text-right")}>
                  <div className={cn("rounded-2xl p-4 shadow-sm text-sm whitespace-pre-wrap", reply.sender === 'client' ? "bg-white border" : "bg-blue-600 text-white")}>{reply.message}</div>
                  <p className="text-[10px] text-gray-400 px-2">{reply.sender === 'admin' ? 'Support Team' : 'You'} • {format(new Date(reply.createdAt), 'PPp')}</p>
                </div>
              </div>))}
          </CardContent>
          <CardFooter className="border-t p-4">
            <div className="flex gap-2 w-full">
              <Textarea placeholder="Type your follow-up message..." className="min-h-[80px] flex-1" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} disabled={ticket.status === 'closed' || ticket.status === 'resolved'} />
              <Button onClick={handleSendReply} className="h-auto btn-primary text-white px-6" disabled={isSubmitting || !replyMessage.trim() || ticket.status === 'closed' || ticket.status === 'resolved'}>{isSubmitting ? <Loader className="animate-spin" /> : <Send className="h-5 w-5" />}</Button>
            </div>
          </CardFooter>
        </Card>
        {(ticket.status === 'closed' || ticket.status === 'resolved') && (<p className="mt-4 text-center text-sm text-gray-500 italic">This ticket is marked as {ticket.status} and is no longer active.</p>)}
      </main>
    </div>
  );
}
