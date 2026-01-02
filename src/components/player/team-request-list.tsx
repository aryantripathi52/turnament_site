'use client';

import { useUser, useFirestore } from '@/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  arrayUnion,
  doc,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { TeamInvitation, Team } from '@/lib/types';
import type { WithId } from '@/firebase/firestore/use-collection';

export function TeamRequestList() {
  const { teamInvitations, user, profile, isProfileLoading, userError } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDecision = async (
    invitation: WithId<TeamInvitation>,
    decision: 'accepted' | 'declined'
  ) => {
    if (!firestore || !user || !profile) return;

    const invitationRef = doc(firestore, 'users', user.uid, 'teamInvitations', invitation.id);
    const teamRef = doc(firestore, 'teams', invitation.teamId);

    try {
      if (decision === 'accepted') {
        await runTransaction(firestore, async (transaction) => {
          const teamDoc = await transaction.get(teamRef);
          if (!teamDoc.exists()) {
            throw new Error('Team does not exist anymore.');
          }

          // Update team members
          transaction.update(teamRef, {
            members: arrayUnion(user.uid),
            [`memberUsernames.${user.uid}`]: profile.username,
          });

          // Update invitation status
          transaction.update(invitationRef, { status: 'accepted' });
        });
      } else {
        // Just update the invitation status for a decline
        await updateDoc(invitationRef, { status: 'declined' });
      }

      toast({
        title: `Invitation ${decision}`,
        description: `You have ${decision} the invitation to join "${invitation.teamName}".`,
      });
      // The useUser hook will automatically refetch and update the UI
    } catch (e: any) {
      console.error('Error processing invitation:', e);
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: e.message || 'Could not process the invitation.',
      });
    }
  };

  if (isProfileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (userError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Could not load team invitations. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!teamInvitations || teamInvitations.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-md">
        <p>You have no pending team invitations.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Invitations</CardTitle>
        <p className="text-sm text-muted-foreground">
          Accept or decline invitations to join teams.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamInvitations.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.teamName}</TableCell>
                <TableCell>{invite.fromUsername}</TableCell>
                <TableCell>
                  {new Date(invite.requestDate.seconds * 1000).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleDecision(invite, 'accepted')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDecision(invite, 'declined')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
