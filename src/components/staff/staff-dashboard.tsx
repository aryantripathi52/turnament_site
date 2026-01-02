'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { Gem, LayoutDashboard, User as UserIcon, Gamepad2, Coins } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { EditProfileForm } from '../admin/edit-profile-form';
import { TournamentList } from '../admin/tournament-list';
import { StaffCoinRequests } from './staff-coin-requests';

export function StaffDashboard() {
  const { user, profile } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

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
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex gap-8">
            <TabsList className="flex flex-col h-full space-y-2">
              <TabsTrigger value="dashboard" className="w-full justify-start gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </TabsTrigger>
               <TabsTrigger value="tournaments" className="w-full justify-start gap-2">
                    <Gamepad2 className="h-5 w-5" />
                    Tournaments
                </TabsTrigger>
                 <TabsTrigger value="coin-requests" className="w-full justify-start gap-2">
                    <Coins className="h-5 w-5" />
                    Coin Requests
                </TabsTrigger>
              <TabsTrigger value="profile" className="w-full justify-start gap-2">
                <UserIcon className="h-5 w-5" />
                Profile
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-0 flex-1">
              <p className="mb-6 text-muted-foreground">This is your staff dashboard. You can manage tournaments and player coin requests from here.</p>
               <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Tournaments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>View, edit, and update ongoing or upcoming tournaments.</p>
                     <Button className="mt-4" onClick={() => setActiveTab('tournaments')}>
                      Manage Tournaments
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Player Coin Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Review and process player requests to add or withdraw coins.</p>
                     <Button className="mt-4" onClick={() => setActiveTab('coin-requests')}>
                      Review Requests
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="tournaments" className="mt-0 flex-1 space-y-6">
                <div>
                    <h3 className="text-xl font-semibold mb-2">All Tournaments</h3>
                    <p className="mb-4 text-muted-foreground">View and manage all active and upcoming tournaments.</p>
                    <TournamentList />
                </div>
            </TabsContent>
            <TabsContent value="coin-requests" className="mt-0 flex-1">
                <StaffCoinRequests />
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
