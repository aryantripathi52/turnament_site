'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Gamepad2 } from 'lucide-react';

const registrationSchema = z.object({
  teamName: z.string().min(3, 'Team name must be at least 3 characters.'),
  contactEmail: z.string().email('Please enter a valid email address.'),
  playerIDs: z.string().min(10, 'Please enter all player IDs, separated by commas.'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export function RegistrationForm({ tournamentName }: { tournamentName: string }) {
  const { toast } = useToast();
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      teamName: '',
      contactEmail: '',
      playerIDs: '',
    },
  });

  function onSubmit(data: RegistrationFormValues) {
    console.log('Registration Data:', data);
    toast({
      title: 'Registration Successful!',
      description: `Your team "${data.teamName}" has been registered for ${tournamentName}.`,
      variant: 'default',
      className: 'bg-green-600 text-white border-green-700',
    });
    form.reset();
  }

  return (
    <Card className="sticky top-24 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-primary"/>
          Register Your Team
        </CardTitle>
        <CardDescription>Fill out the form below to compete in {tournamentName}.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="teamName"
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
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="playerIDs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player IDs</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Player1_ID, Player2_ID, Player3_ID, Player4_ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the in-game IDs for all team members, separated by commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6">
              Register Now
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
