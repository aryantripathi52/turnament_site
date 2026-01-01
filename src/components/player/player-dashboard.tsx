'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { Gem } from 'lucide-react';
import { Wallet } from './wallet';

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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-primary" />
              <span className="font-semibold">{profile?.coins ?? 0}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p>This is your player dashboard. From here, you will be able to manage your profile, view your teams, and see upcoming matches.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Wallet />
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
