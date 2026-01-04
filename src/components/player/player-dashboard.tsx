'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { Gem, User as UserIcon, LayoutDashboard, Wallet as WalletIcon, History as HistoryIcon, Gamepad2, Trophy, LifeBuoy } from 'lucide-react';
import { Wallet } from './wallet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { EditProfileForm } from '../admin/edit-profile-form';
import { PlayerTournamentList } from './player-tournament-list';
import { MyTournaments } from './my-tournaments';
import { UserHistory } from './user-history';
import { SupportTab } from './support-tab';


export function PlayerDashboard() {
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
    <div className="container mx-auto py-8 space-y-6">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle>Welcome, {profile?.username || user?.email || 'Player'}</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                <Gem className="h-5 w-5 text-primary" />
                <span className="font-semibold">{profile?.coins ?? 0}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>
          </CardHeader>
        </Card>
        <Tabs defaultValue="dashboard" className="w-full">
            <div className="sticky top-14 md:top-0 z-10 -mx-4 sm:mx-0 bg-background/80 backdrop-blur-md border-b">
                <div className="overflow-x-auto pb-2 scrollbar-hide px-4">
                    <TabsList className="h-auto bg-transparent p-0 gap-4 flex-nowrap justify-start">
                        <TabsTrigger value="dashboard">
                            <LayoutDashboard className="mr-2"/> Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="tournaments">
                            <Gamepad2 className="mr-2"/> Tournaments
                        </TabsTrigger>
                        <TabsTrigger value="my-tournaments">
                            <Trophy className="mr-2"/> My Tournaments
                        </TabsTrigger>
                        <TabsTrigger value="wallet">
                            <WalletIcon className="mr-2"/> My Wallet
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <HistoryIcon className="mr-2"/> History
                        </TabsTrigger>
                        <TabsTrigger value="support">
                            <LifeBuoy className="mr-2"/> Support
                        </TabsTrigger>
                        <TabsTrigger value="profile">
                            <UserIcon className="mr-2"/> Profile
                        </TabsTrigger>
                    </TabsList>
                </div>
            </div>

            <div className="mt-6">
                <TabsContent value="dashboard">
                    <p className="mb-6 text-muted-foreground">This is your player dashboard. Find tournaments to join and manage your wallet.</p>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Find a Tournament</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>Browse the list of available tournaments and join the battle.</p>
                                 <Button className="mt-4" disabled>View Tournaments</Button>
                            </CardContent>
                        </Card>
                        <Card>
                        <CardHeader>
                            <CardTitle>Manage Your Wallet</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Add funds to your wallet or withdraw your winnings.</p>
                            <Button className="mt-4" disabled>Go to My Wallet</Button>
                        </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="tournaments">
                    <PlayerTournamentList />
                </TabsContent>
                <TabsContent value="my-tournaments">
                    <MyTournaments />
                </TabsContent>
                <TabsContent value="wallet">
                    <Wallet />
                </TabsContent>
                <TabsContent value="history">
                <UserHistory />
                </TabsContent>
                <TabsContent value="support">
                <SupportTab />
                </TabsContent>
                <TabsContent value="profile">
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
                                    <span>{user?.email || 'NA'}</span>
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
            </div>
        </Tabs>
    </div>
  );
}
