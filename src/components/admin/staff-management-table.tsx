'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/firebase/auth/use-user';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, ShieldOff, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function StaffManagementTable() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const staffQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'staff')
    );
  }, [firestore]);

  const { data: staff, isLoading, error } = useCollection<UserProfile>(staffQuery);

  const handleToggleStatus = async (
    staffId: string,
    currentStatus: 'active' | 'blocked'
  ) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: 'Firestore is not available.',
      });
      return;
    }
    try {
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
      const staffDocRef = doc(firestore, 'users', staffId);
      await updateDoc(staffDocRef, { status: newStatus });

      toast({
        title: 'Status Updated',
        description: `Staff member has been ${newStatus}.`,
      });
    } catch (e: any) {
      console.error(`Failed to update status:`, e);
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: e.message || 'An unexpected error occurred.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Fetching Staff</AlertTitle>
        <AlertDescription>
          There was a problem loading the staff list. Please check your connection and permissions.
        </AlertDescription>
      </Alert>
    );
  }

  if (!staff || staff.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4 border rounded-md">
        No staff members found.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.username}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Badge variant={member.status === 'active' ? 'secondary' : 'destructive'}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {member.status === 'active' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleToggleStatus(member.id, member.status)}
                    >
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Block
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(member.id, member.status)}
                       className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Unblock
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    