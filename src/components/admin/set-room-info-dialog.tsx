
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import type { Tournament } from '@/lib/types';
import { WithId } from '@/firebase/firestore/use-collection';

const formSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required.'),
  roomPassword: z.string().min(1, 'Room Password is required.'),
});

interface SetRoomInfoDialogProps {
  tournament: WithId<Tournament>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SetRoomInfoDialog({ tournament, isOpen, setIsOpen }: SetRoomInfoDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      roomId: tournament.roomId || '',
      roomPassword: tournament.roomPassword || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
      return;
    }

    try {
      const tournamentRef = doc(firestore, 'tournaments', tournament.id);
      const updatedData = {
        roomId: values.roomId,
        roomPassword: values.roomPassword,
        status: 'live' as const, // Set status to 'live'
      };

      await updateDoc(tournamentRef, updatedData);

      toast({
        title: 'Room Info Set!',
        description: `Room details for "${tournament.name}" have been updated and the tournament is now live.`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error setting room info:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An error occurred while setting room info.',
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Room Info for: {tournament.name}</DialogTitle>
          <DialogDescription>
            Enter the Room ID and Password. This will set the tournament status to 'Live'.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Room ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Room Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save & Go Live'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
