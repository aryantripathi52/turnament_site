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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  amountCoins: z.coerce.number().positive({ message: 'Please enter a valid amount.' }),
  amountPaid: z.coerce.number().positive({ message: 'Please enter a valid amount.' }),
  transactionId: z.string().min(1, { message: 'Transaction ID is required.' }),
});

interface AddFundsFormProps {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AddFundsForm({ children, isOpen, setIsOpen }: AddFundsFormProps) {
  const firestore = useFirestore();
  const { user, profile } = useUser();
  const { toast } = useToast();
  const qrCodeImage = PlaceHolderImages.find(img => img.id === 'qr-code-placeholder');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountCoins: 0,
      amountPaid: 0,
      transactionId: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !profile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit a request.',
      });
      return;
    }

    try {
      const coinRequestCollection = collection(firestore, 'coinRequests');
      await addDoc(coinRequestCollection, {
        userId: user.uid,
        username: profile.username,
        type: 'add',
        amountCoins: values.amountCoins,
        amountPaid: values.amountPaid,
        transactionId: values.transactionId,
        status: 'pending',
        requestDate: serverTimestamp(),
        decisionDate: null,
      });

      toast({
        title: 'Request Submitted',
        description: 'Your request to add coins has been sent for approval. Please allow up to 12 hours for the review.',
      });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error submitting coin request:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An error occurred while submitting your request. Please try again.',
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds Request</DialogTitle>
          <DialogDescription>
            Scan the QR code to pay, then fill out the form below and submit it for approval.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {qrCodeImage && (
             <div className="p-2 border rounded-md">
                <Image
                    src={qrCodeImage.imageUrl}
                    alt={qrCodeImage.description}
                    width={200}
                    height={200}
                    data-ai-hint={qrCodeImage.imageHint}
                />
             </div>
          )}
          <p className="text-sm text-center text-muted-foreground">
            After paying, enter the details below exactly as they appear on your receipt.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amountCoins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coins to Add</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="amountPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 100.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the ID from your payment receipt" {...field} />
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
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
    