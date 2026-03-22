'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirebase, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader, MessageSquare, User, ShieldCheck, Send, Info, Save } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Reply {
  message: string;
  sender: 'client' | 'admin';
  createdAt: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  orderId: string | null;
  subject: string;
  message: string;
  status: 'open' | 'in_review' | 'replied' | 'resolved' | 'closed';
  replies: Reply[];
  internalNotes: string;
  createdAt: any;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

export default function AdminTicketManagementPage() {
  const { ticketId } = useParams();
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: ticket, loading: ticketLoading } = useDoc<SupportTicket>('tickets', ticketId as string);
  
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (ticket) {
      setInternalNotes(ticket.internalNotes || '');
    }
  }, [ticket]);

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
      sender: 'admin' as const,
      createdAt: new Date().toISOString(),
    };

    updateDoc(ticketRef, {
      replies: arrayUnion(newReply),
      status: 'replied',
      updatedAt: serverTimestamp()
    })
      .then(() => {
        setReplyMessage('');
        toast({ title: "Reply Sent", description: "Sent to client." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: ticketRef.path,
          operation: 'update',
          requestResourceData: { replies: '...', status: 'replied' },
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleSaveNotes = () => {
    if (!ticket) return;
    setIsSavingNotes(true);
    const ticketRef = doc(firestore, 'tickets', ticket.id);
    const updatedData = { internalNotes: internalNotes.trim(), updatedAt: serverTimestamp() };
    updateDoc(ticketRef, updatedData)
      .then(() => toast({ title: "Notes Saved" }))
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: ticketRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSavingNotes(false));
  };

  const handleStatusChange = (status: string) => {
    if (!ticket) return;
    const ticketRef = doc(firestore, 'tickets', ticket.id);
    const updatedData = { status: status as any, updatedAt: serverTimestamp() };
    updateDoc(ticketRef, updatedData)
      .then(() => toast({ title: "Status Updated" }))
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: ticketRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (userLoading || !user || user.email !== ADMIN_EMAIL) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (ticketLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!ticket) return <div className="p-8 text-center">Not found.</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></Link>
            <Link href="/admin" className="text-sm font-medium hover:text-blue-600 transition-colors">Admin Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/tickets"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-gray-500 uppercase">{ticket.id.slice(0, 8)}</Badge>
                <span className="text-xs text-gray-500">by {ticket.userName} on {ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'PPpp') : 'Just now'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold uppercase text-gray-400 mr-2">Status:</Label>
            <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 flex flex-col h-[70vh]">
                <CardHeader className="border-b bg-gray-50/50 py-3"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-600" />Ticket Chat</CardTitle></CardHeader>
                <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Initial Client Message - Align Right */}
                    <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-blue-600" /></div>
                        <div className="space-y-1 text-right">
                            <div className="bg-white border rounded-2xl p-4 shadow-sm"><p className="text-xs font-bold text-blue-600 mb-1">CLIENT INITIAL MESSAGE</p><p className="text-sm whitespace-pre-wrap">{ticket.message}</p></div>
                            <p className="text-[10px] text-gray-400 px-2">{ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'PPp') : 'Just now'}</p>
                        </div>
                    </div>
                    {/* Replies */}
                    {ticket.replies.map((reply, index) => (
                        <div key={index} className={cn("flex gap-3 max-w-[85%]", reply.sender === 'admin' ? "" : "ml-auto flex-row-reverse")}>
                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", reply.sender === 'admin' ? "bg-green-100" : "bg-blue-100")}>{reply.sender === 'admin' ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <User className="h-4 w-4 text-blue-600" />}</div>
                            <div className={cn("space-y-1", reply.sender === 'admin' ? "" : "text-right")}>
                                <div className={cn("rounded-2xl p-4 shadow-sm text-sm whitespace-pre-wrap", reply.sender === 'admin' ? "bg-blue-600 text-white" : "bg-white border")}>{reply.message}</div>
                                <p className="text-[10px] text-gray-400 px-2">{reply.sender === 'admin' ? 'Support' : ticket.userName} • {format(new Date(reply.createdAt), 'PPp')}</p>
                            </div>
                        </div>))}
                </CardContent>
                <CardFooter className="border-t p-4">
                    <div className="flex gap-2 w-full">
                        <Textarea placeholder="Type your reply..." className="min-h-[80px] flex-1" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} />
                        <Button onClick={handleSendReply} className="h-auto btn-primary text-white px-6" disabled={isSubmitting || !replyMessage.trim()}>{isSubmitting ? <Loader className="animate-spin" /> : <Send className="h-5 w-5" />}</Button>
                    </div>
                </CardFooter>
            </Card>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4 text-gray-500" />Ticket Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm"><span className="text-gray-500">Category:</span><span className="font-medium">{ticket.category}</span><span className="text-gray-500">Order:</span><span className="font-medium">{ticket.orderId || 'None'}</span></div>
                        <Separator />
                        <div className="pt-2"><Label className="text-xs font-bold text-gray-400 uppercase">Internal Notes</Label><Textarea className="mt-2 min-h-[150px] bg-yellow-50/50 text-sm" placeholder="Private notes..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} /><Button onClick={handleSaveNotes} size="sm" variant="outline" className="w-full mt-2" disabled={isSavingNotes}>{isSavingNotes ? <Loader className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}Save Notes</Button></div>
                    </CardContent>
                </Card>
                <Alert variant="default" className="bg-blue-50 border-blue-100"><Info className="h-4 w-4 text-blue-600" /><AlertTitle className="text-blue-800 text-xs font-bold uppercase">Quick Tip</AlertTitle><AlertDescription className="text-blue-700 text-xs">Replying marks status as 'replied'.</AlertDescription></Alert>
            </div>
        </div>
      </main>
    </div>
  );
}