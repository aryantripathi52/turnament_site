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

  const creationDate = user?.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString() 
    : 'N/A';

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
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p>{profile?.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Profile Created</p>
                  <p>{creationDate}</p>
                </div>
                <Button className="mt-4" disabled>Edit Profile</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
