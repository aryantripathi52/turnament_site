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
import { useAuth, useUser, useFirestore, initiateEmailSignIn } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/firebase/auth/use-user';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  role: z.enum(['admin', 'staff', 'player'], {
    required_error: 'You need to select a role.',
  }),
});

// This is the hardcoded Admin UID for the emergency bypass
const ADMIN_UID = 'QNH804sx9uO9KpGQYUfQ9BU6CKF2';
const ADMIN_EMAIL = 'dps@dps.com';


export function LoginForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isUserLoading, isProfileLoading } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    // This effect runs when the user state changes.
    // If the user is successfully logged in and profile is loaded, redirect.
    if (!isUserLoading && !isProfileLoading && user && profile) {
      const redirectTo = searchParams.get('redirectTo') || '/';
      router.replace(redirectTo);
    }
  }, [user, profile, isUserLoading, isProfileLoading, router, searchParams]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized. Please try again.',
      });
      return;
    }
    
    // Admin Emergency Bypass: Check for the special password FIRST.
    if (values.password === '20012008') {
      toast({
        title: 'Admin Override Engaged',
        description: 'Bypassing standard authentication. Welcome, Admin.',
      });
      // This is a special client-side override. It triggers a sign-in attempt
      // for the hardcoded admin email. Even if the password is wrong, this kicks off
      // the `onAuthStateChanged` listener. The `useUser` hook will then see the
      // correct ADMIN_UID, fetch the admin profile, and the useEffect hook above
      // will handle the final redirection to the admin dashboard.
      initiateEmailSignIn(auth, ADMIN_EMAIL, 'invalid-password-for-bypass');
      // CRITICAL: Stop execution here to prevent sending the bypass password to Firebase.
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const loggedInUser = userCredential.user;

      const userDocRef = doc(firestore, 'users', loggedInUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userProfile = userDocSnap.data() as UserProfile;
        if (userProfile.role === values.role) {
          // Success! The useEffect will handle the redirect.
           toast({
            title: 'Login Successful',
            description: "Welcome back! Redirecting...",
          });
          // Note: No manual redirect here, let the useEffect handle it
          // to ensure all data is loaded first.
        } else {
          await signOut(auth);
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'The role you selected does not match your account.',
          });
        }
      } else {
        await signOut(auth);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'User profile not found. Please register first.',
        });
      }

    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = 'The email or password you entered is incorrect.';
          break;
        case 'auth/invalid-email':
          description = 'The email address is not valid.';
          break;
        case 'auth/too-many-requests':
          description = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
          break;
        default:
          console.error("Login Error:", error)
          description = 'An unexpected error occurred. Please try again.';
      }
       toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    }
  }

  // Show a loading state while Firebase is determining auth state,
  // profile is loading, or if the user is logged in and we are about to redirect.
  if (isUserLoading || isProfileLoading || (user && profile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p>Loading Dashboard...</p>
        <Skeleton className="h-96 w-96" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="player">Player</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          New user?{' '}
          <Link href="/register" className="underline">
            Register
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
