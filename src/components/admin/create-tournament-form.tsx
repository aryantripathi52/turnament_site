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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
  startDate: z.date({ required_error: 'A start date is required.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format (HH:MM)." }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format (HH:MM)." }),
}).refine((data) => {
    const startDateTime = new Date(data.startDate);
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes);

    const endDateTime = new Date(data.endDate);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes);

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
  const [isStartOpen, setIsStartOpen] = React.useState(false);
  const [isEndOpen, setIsEndOpen] = React.useState(false);

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
      startTime: "12:00",
      endTime: "18:00",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
      return;
    }

    try {
        const startDateTime = new Date(values.startDate);
        const [startHours, startMinutes] = values.startTime.split(':').map(Number);
        startDateTime.setHours(startHours, startMinutes);

        const endDateTime = new Date(values.endDate);
        const [endHours, endMinutes] = values.endTime.split(':').map(Number);
        endDateTime.setHours(endHours, endMinutes);

      const tournamentCollection = collection(firestore, 'tournaments');
      await addDoc(tournamentCollection, {
        name: values.name,
        categoryId: values.categoryId,
        description: values.description,
        prizePoolFirst: values.prizePoolFirst,
        prizePoolSecond: values.prizePoolSecond,
        prizePoolThird: values.prizePoolThird,
        entryFee: values.entryFee,
        startDate: startDateTime,
        endDate: endDateTime,
        rules: "Standard tournament rules apply.", // Placeholder
        registrationLink: "#", // Placeholder
        contactEmail: "contact@example.com", // Placeholder
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
                                <Textarea placeholder="Describe the tournament..." {...field} rows={12} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
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

                     <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Start Date & Time</FormLabel>
                                <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            setIsStartOpen(false);
                                        }}
                                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage className="pt-2"/>
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem className="flex flex-col justify-end">
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
                                <FormItem className="flex flex-col">
                                <FormLabel>End Date & Time</FormLabel>
                                <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            setIsEndOpen(false);
                                        }}
                                        disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0)))}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage className="pt-2"/>
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                                <FormItem className="flex flex-col justify-end">
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
