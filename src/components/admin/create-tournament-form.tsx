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
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import type { Category } from '@/lib/types';


const formSchema = z.object({
  name: z.string().min(3, { message: 'Tournament name must be at least 3 characters.' }),
  categoryId: z.string({ required_error: 'Please select a game category.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  prizePoolFirst: z.coerce.number().positive({ message: '1st prize must be a positive number.' }),
  prizePoolSecond: z.coerce.number().positive({ message: '2nd prize must be a positive number.' }),
  prizePoolThird: z.coerce.number().positive({ message: '3rd prize must be a positive number.' }),
  entryFee: z.coerce.number().min(0, { message: "Entry fee can't be negative." }),
  maxPlayers: z.coerce.number().positive({ message: 'Max players must be a positive number.' }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format (HH:MM)." }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format (HH:MM)." }),
  roomId: z.string().optional(),
  roomPassword: z.string().optional(),
}).refine((data) => {
    const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
    const endDateTime = new Date(`${data.endDate}T${data.endTime}`);
    return endDateTime > startDateTime;
}, {
  message: "End date and time must be after start date and time.",
  path: ["endDate"], 
});


interface CreateTournamentFormProps {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function CreateTournamentForm({ children, isOpen, setIsOpen }: CreateTournamentFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      prizePoolFirst: 0,
      prizePoolSecond: 0,
      prizePoolThird: 0,
      entryFee: 0,
      maxPlayers: 100,
      startDate: '',
      startTime: "12:00",
      endDate: '',
      endTime: "18:00",
      roomId: '',
      roomPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
      return;
    }

    try {
        const startDateTime = new Date(`${values.startDate}T${values.startTime}`);
        const endDateTime = new Date(`${values.endDate}T${values.endTime}`);

      const tournamentCollection = collection(firestore, 'tournaments');
      await addDoc(tournamentCollection, {
        name: values.name,
        categoryId: values.categoryId,
        description: values.description,
        prizePoolFirst: values.prizePoolFirst,
        prizePoolSecond: values.prizePoolSecond,
        prizePoolThird: values.prizePoolThird,
        entryFee: values.entryFee,
        maxPlayers: values.maxPlayers,
        registeredCount: 0,
        startDate: startDateTime,
        endDate: endDateTime,
        status: 'upcoming', // Default status
        rules: "Standard tournament rules apply.", // Placeholder
        registrationLink: "#", // Placeholder
        contactEmail: "contact@example.com", // Placeholder
        roomId: values.roomId || null,
        roomPassword: values.roomPassword || null,
      });

      toast({
        title: 'Tournament Created',
        description: `The tournament "${values.name}" has been successfully created.`,
      });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'An error occurred while creating the tournament.',
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            Fill in the details below to set up a new tournament.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tournament Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Summer Skirmish" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe the tournament..." {...field} rows={8} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="roomId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Room ID (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 123456" {...field} />
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
                                <FormLabel>Room Password (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., roompass" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <div className="space-y-6">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Game Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select a game"} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {categories?.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                        control={form.control}
                        name="prizePoolFirst"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>1st Prize (Coins)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="25000" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="prizePoolSecond"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>2nd Prize (Coins)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="15000" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="prizePoolThird"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>3rd Prize (Coins)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="10000" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="entryFee"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Entry Fee (Coins)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 100" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="maxPlayers"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Max Players</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 100" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
             </div>
            <DialogFooter className="col-span-6 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Tournament'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
