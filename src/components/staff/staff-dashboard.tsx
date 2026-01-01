'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { Gem, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { EditProfileForm } from '../admin/edit-profile-form';

export function StaffDashboard() {
  const { user, profile } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
          <CardTitle>Welcome, {profile?.username || user?.email || 'Staff'}</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-primary" />
              <span className="font-semibold">{profile?.coins ?? 0}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard" orientation="vertical" className="flex gap-8">
            <TabsList className="flex flex-col h-full space-y-2">
              <TabsTrigger value="dashboard" className="w-full justify-start gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="profile" className="w-full justify-start gap-2">
                <UserIcon className="h-5 w-5" />
                Profile
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-0 flex-1">
              <p className="mb-6 text-muted-foreground">This is your staff dashboard. You can manage tournaments and player registrations from here.</p>
              <div className="grid gap-6 md:grid-cols-2">
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
            </TabsContent>
            <TabsContent value="profile" className="mt-0 flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>My Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Username</span>
                      <span>{profile?.username || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Email</span>
                      <span>{user?.email || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Joined</span>
                      <span>{creationDate}</span>
                    </p>
                  </div>
                  <EditProfileForm
                    user={user}
                    profile={profile}
                    isOpen={isEditDialogOpen}
                    setIsOpen={setIsEditDialogOpen}
                  >
                    <Button className="mt-4 w-full" onClick={() => setIsEditDialogOpen(true)}>Edit Profile</Button>
                  </EditProfileForm>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
