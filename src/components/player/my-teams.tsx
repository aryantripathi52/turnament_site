'use client';
import { useUser, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, PlusCircle, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, query, where, getDocs, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Team } from '@/lib/types';
import type { WithId } from '@/firebase/firestore/use-collection';

// --- Create Team Form ---
const createTeamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters.').max(20, 'Team name cannot exceed 20 characters.'),
});

function CreateTeamForm({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
  const { user, profile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '' },
  });

  async function onSubmit(values: z.infer<typeof createTeamSchema>) {
    if (!user || !profile || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a team.' });
      return;
    }

    try {
      await addDoc(collection(firestore, 'teams'), {
        name: values.name,
        ownerId: user.uid,
        members: [user.uid],
        memberUsernames: { [user.uid]: profile.username },
      });
      toast({ title: 'Team Created', description: `Team "${values.name}" has been created successfully.` });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create team.' });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Team</DialogTitle>
          <DialogDescription>Choose a name for your new team.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Champions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>Create Team</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// --- Invite Member Form ---
const inviteMemberSchema = z.object({
  username: z.string().min(1, "Username is required."),
});

function InviteMemberForm({ team }: { team: WithId<Team> }) {
    const [isOpen, setIsOpen] = useState(false);
    const { user, profile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof inviteMemberSchema>>({
        resolver: zodResolver(inviteMemberSchema),
        defaultValues: { username: '' },
    });

    async function onSubmit(values: z.infer<typeof inviteMemberSchema>) {
        if (!user || !profile || !firestore || user.uid !== team.ownerId) {
            toast({ variant: 'destructive', title: 'Unauthorized', description: 'Only the team owner can send invitations.' });
            return;
        }

        if (values.username === profile.username) {
            toast({ variant: 'destructive', title: 'Invalid User', description: 'You cannot invite yourself.' });
            return;
        }

        try {
            // Find user by username
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where("username", "==", values.username));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'User Not Found', description: `No user found with username "${values.username}".` });
                return;
            }

            const invitedUserDoc = querySnapshot.docs[0];
            const invitedUser = { id: invitedUserDoc.id, ...invitedUserDoc.data() };

            // Check if user is already in the team
            if (team.members.includes(invitedUser.id)) {
                 toast({ variant: 'destructive', title: 'Already a Member', description: `${values.username} is already in the team.` });
                 return;
            }

            // Check if an invitation already exists
            const invitesRef = collection(firestore, 'users', invitedUser.id, 'teamInvitations');
            const inviteQuery = query(invitesRef, where("teamId", "==", team.id), where("status", "==", "pending"));
            const existingInviteSnapshot = await getDocs(inviteQuery);

            if(!existingInviteSnapshot.empty) {
                 toast({ title: 'Invitation Already Sent', description: `An invitation to join this team has already been sent to ${values.username}.` });
                 return;
            }

            // Create invitation
            await addDoc(invitesRef, {
                teamId: team.id,
                teamName: team.name,
                fromUserId: user.uid,
                fromUsername: profile.username,
                toUserId: invitedUser.id,
                toUsername: invitedUser.username,
                status: 'pending',
                requestDate: serverTimestamp(),
            });

            toast({ title: 'Invitation Sent!', description: `An invitation to join "${team.name}" has been sent to ${values.username}.` });
            setIsOpen(false);
            form.reset();

        } catch (error) {
            console.error("Error sending invitation:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send invitation.' });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full" disabled={user?.uid !== team.ownerId}>
                    <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite a Member to {team.name}</DialogTitle>
                    <DialogDescription>Enter the username of the player you want to invite.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Player's Username</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter username" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting}>Send Invitation</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// --- Main MyTeams Component ---
export function MyTeams() {
  const { teams, user, isProfileLoading, userError } = useUser();
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  if (isProfileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Could not load team data. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold tracking-tight">My Teams</h2>
         <CreateTeamForm isOpen={isCreateTeamOpen} setIsOpen={setIsCreateTeamOpen} />
      </div>

      {!teams || teams.length === 0 ? (
        <div className="text-center text-muted-foreground p-8 border rounded-md">
          <p>You are not part of any team yet.</p>
          <p className="text-sm mt-2">Why not create one?</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {team.name}
                </CardTitle>
                <CardDescription>
                  Owner: {team.memberUsernames[team.ownerId]} {team.ownerId === user?.uid && '(You)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <h4 className="font-semibold mb-2">Members:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {team.members.map((memberId) => (
                    <li key={memberId}>{team.memberUsernames[memberId] || 'Unknown User'} {memberId === user?.uid && '(You)'}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                 <InviteMemberForm team={team} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
