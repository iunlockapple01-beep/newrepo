'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Clock, Filter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { where } from 'firebase/firestore';

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId: string | null;
  category: string;
  subject: string;
  status: 'open' | 'in_review' | 'replied' | 'resolved' | 'closed';
  createdAt: any;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

export default function AdminTicketsPage() {
  const { data: user, loading: userLoading } = useUser();
  const router = useRouter();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const ticketConstraints = useMemo(() => {
    if (userLoading || !user) return [where('userId', '==', 'none')];
    if (isAdmin) return [];
    return [where('userId', '==', user.uid)];
  }, [isAdmin, user, userLoading]);

  const { data: tickets, loading: ticketsLoading } = useCollection<SupportTicket>('tickets', { constraints: ticketConstraints });

  useEffect(() => {
    if (userLoading) return;
    if (!user || !isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_review': return 'outline';
      case 'replied': return 'secondary';
      case 'resolved': return 'secondary';
      case 'closed': return 'destructive';
      default: return 'outline';
    }
  };

  if (userLoading || !user || !isAdmin) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const sortedTickets = tickets?.sort((a, b) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-sm font-medium hover:text-blue-600 transition-colors">Admin Dashboard</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Support Ticket Management</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Last updated: {format(new Date(), 'pp')}
          </div>
        </div>

        <Card>
          <CardHeader className="bg-gray-50/50 border-b">
            <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    All Tickets ({tickets?.length || 0})
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-500">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ticketsLoading ? (
              <div className="p-8 text-center">Loading tickets...</div>
            ) : sortedTickets && sortedTickets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Related Order</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTickets.map(ticket => (
                    <TableRow key={ticket.id} className={ticket.status === 'open' ? 'bg-blue-50/30' : ''}>
                      <TableCell className="text-xs">{ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'MMM dd, p') : 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs uppercase">{ticket.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{ticket.userName}</span>
                            <span className="text-[10px] text-gray-500">{ticket.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.orderId ? (
                            <Badge variant="outline" className="font-mono text-xs">
                                {ticket.orderId}
                            </Badge>
                        ) : (
                            <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{ticket.category}</TableCell>
                      <TableCell className="font-medium text-xs">{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/tickets/${ticket.id}`}>
                          <Button size="sm" className="btn-primary text-white">Manage</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-gray-500">
                No support tickets found in the system.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
