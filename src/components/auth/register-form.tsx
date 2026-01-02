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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  roleKey: z.string().optional(),
});

// This is a simplified, client-side mapping.
// In a real application, this logic should be securely handled on the backend.
const getRoleFromKey = (key: string): 'admin' | 'staff' | 'player' | null => {
  if (key === 'ADMIN_DPS#1') {
    return 'admin';
  }
  if (key === 'STAFF_DPS#1') {
    return 'staff';
  }
  if (key === '' || !key) {
    return 'player';
  }
  return null; // Invalid key
};

export function RegisterForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      roleKey: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized. Please try again.',
      });
      return;
    }
    
    const role = getRoleFromKey(values.roleKey || '');
    if (!role) {
      form.setError('roleKey', {
        type: 'manual',
        message: 'Invalid Role Key. Leave blank for player.',
      });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;

      const userProfile = {
        id: newUser.uid,
        email: newUser.email,
        username: values.username,
        role: role,
        coins: 0, // Initial coins set to 0
      };
      
      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, userProfile);
      
      toast({
        title: 'Registration Successful',
        description: "Welcome! We're logging you in...",
      });
      // The useEffect will handle the redirect to '/'
    } catch (error: any) {
      console.error("Registration Error:", error);
      let description = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/email-already-in-use':
            description = 'This email is already in use. Please log in instead.';
            break;
        case 'auth/invalid-email':
            description = 'The email address is not valid.';
            break;
        case 'auth/weak-password':
            description = 'The password is too weak.';
            break;
        default:
            description = 'An unexpected error occurred during registration.';
            break;
      }
       toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: description,
      });
    }
  }

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          Create an account to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="your_username" {...field} />
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
                    <Input placeholder="you@example.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                        className="pr-10"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Key (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter admin or staff key if you have one"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
               {form.formState.isSubmitting ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
