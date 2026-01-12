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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const formSchema = z.object({
  username: z.string().min(3, { message: 'Full name must be at least 3 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function HireStaffForm() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  if (profile?.role !== 'admin') {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
                You do not have permission to view this page. This action is for administrators only.
            </AlertDescription>
        </Alert>
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase services are not available.',
      });
      return;
    }

    const tempAppName = `staff-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, values.password);
      const newStaffUser = userCredential.user;

      const userProfile = {
        id: newStaffUser.uid,
        username: values.username,
        email: newStaffUser.email,
        role: 'staff',
        coins: 0,
      };

      await setDoc(doc(firestore, 'users', newStaffUser.uid), userProfile);

      toast({
        title: 'Staff Account Created!',
        description: `${values.username} has been successfully created with the role 'staff'.`,
      });

      form.reset();

    } catch (error: any) {
      console.error('Error creating staff account:', error);
      let errorMessage = 'An unexpected error occurred.';
       if (error.code === 'auth/email-already-in-use') {
           errorMessage = 'This email address is already registered. Please use a different email.';
       }
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: errorMessage,
      });
    } finally {
        await deleteApp(tempApp);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Staff Account</CardTitle>
        <CardDescription>
          Manually create a new staff account. They will be able to manage tournaments immediately after logging in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="staff-member@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                     <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
                type="submit" 
                className="w-full font-bold border-2 border-yellow-500/0 hover:border-yellow-500 transition-all duration-300 shadow-[0_0_15px_-5px_theme(colors.yellow.500)] hover:shadow-[0_0_20px_0px_theme(colors.yellow.500)]"
                disabled={form.formState.isSubmitting}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              {form.formState.isSubmitting ? 'Creating Account...' : 'Create Staff Account'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
