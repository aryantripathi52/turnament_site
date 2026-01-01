'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';

export function StaffDashboard() {
  const { user, profile } = useUser();

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Welcome, {profile?.username || user?.email || 'Staff'}</CardTitle>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </CardHeader>
        <CardContent>
          <p>This is your staff dashboard. You can manage tournaments and player registrations from here.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Manage Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                <p>View, edit, and update ongoing or upcoming tournaments.</p>
                <Button className="mt-4" disabled>Coming Soon</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Player Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <p>View and manage team registrations for tournaments.</p>
                 <Button className="mt-4" disabled>Coming Soon</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
