'use client';

import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';

export function AdminDashboard() {
  const { user, profile } = useUser();

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin Dashboard</CardTitle>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </CardHeader>
        <CardContent>
          <p>Welcome, {profile?.username || user?.email || 'Admin'}! Manage your platform from here.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create Tournament</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Organize a new tournament for players.</p>
                <Button className="mt-4" disabled>Coming Soon</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p>View and manage your admin profile.</p>
                 <Button className="mt-4" disabled>Coming Soon</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
