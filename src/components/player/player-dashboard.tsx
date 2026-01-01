'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';

export function PlayerDashboard() {
  const { user, profile } = useUser();

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{profile?.username || user?.email || 'Player'}</CardTitle>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </CardHeader>
        <CardContent>
          <p>This is your player dashboard. From here, you will be able to manage your profile, view your teams, and see upcoming matches.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p>View and edit your player profile.</p>
                <Button className="mt-4" disabled>Coming Soon</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>My Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Manage your team rosters and view team stats.</p>
                 <Button className="mt-4" disabled>Coming Soon</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
