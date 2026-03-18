'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser, useCollection } from '@/firebase';
import { where } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

export function TicketNotificationListener() {
  const { data: user } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [repliedTickets, setRepliedTickets] = useState<any[]>([]);

  const ticketConstraints = useMemo(() => {
    // If no user is present, query a non-existent ID to prevent fetching all tickets
    if (!user) return [where('userId', '==', 'none')];
    return [where('userId', '==', user.uid), where('status', '==', 'replied')];
  }, [user]);

  const { data: tickets } = useCollection<any>('tickets', { constraints: ticketConstraints });

  useEffect(() => {
    if (tickets && tickets.length > 0 && user) {
      const acknowledgedKey = `acknowledged_replies_${user.uid}`;
      const acknowledgedIds = JSON.parse(localStorage.getItem(acknowledgedKey) || '[]');
      
      const newReplies = tickets.filter(t => !acknowledgedIds.includes(t.id));
      
      if (newReplies.length > 0) {
        setRepliedTickets(newReplies);
        setOpen(true);
      }
    }
  }, [tickets, user]);

  const handleClose = () => {
    if (user) {
      const acknowledgedKey = `acknowledged_replies_${user.uid}`;
      const acknowledgedIds = JSON.parse(localStorage.getItem(acknowledgedKey) || '[]');
      const newAcknowledged = [...new Set([...acknowledgedIds, ...repliedTickets.map(t => t.id)])];
      localStorage.setItem(acknowledgedKey, JSON.stringify(newAcknowledged));
    }
    setOpen(false);
  };

  const handleView = (id: string) => {
    handleClose();
    router.push(`/my-account/tickets/${id}`);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <MessageSquare className="h-5 w-5" />
            Support Update
          </DialogTitle>
          <DialogDescription>
            You have received a reply to your support ticket(s).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {repliedTickets.map(ticket => (
            <div key={ticket.id} className="p-3 border rounded-lg bg-blue-50/50 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{ticket.subject}</p>
                <p className="text-xs text-gray-500">Category: {ticket.category}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleView(ticket.id)}>View</Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleClose} variant="outline" className="w-full sm:w-auto">Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
