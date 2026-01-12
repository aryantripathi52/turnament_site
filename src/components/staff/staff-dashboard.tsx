'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { Gem, LayoutDashboard, User as UserIcon, Gamepad2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { EditProfileForm } from '../admin/edit-profile-form';
import { TournamentList } from '../admin/tournament-list';
import { CreateTournamentForm } from '../admin/create-tournament-form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function StaffDashboard() {
  const { user, profile } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    const auth = getAuth();
    try {
        await signOut(auth);
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push('/login');
    } catch (error) {
        console.error("Logout failed", error);
        toast({ variant: 'destructive', title: "Logout Failed", description: "An error occurred during logout." });
    }
  };

  const creationDate = user?.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString()
    : 'N/A';


  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Welcome, {profile?.username || user?.email || 'Staff'}</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
              <Gem className="h-5 w-5 text-primary" />
              <span className="font-semibold">{profile?.coins ?? 0}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard" className="w-full">
            <div className="sticky top-0 z-10 -mx-4 sm:mx-0 bg-background/80 backdrop-blur-md">
                <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <TabsList className="h-auto bg-transparent p-2 gap-2 flex-nowrap justify-start">
                        <TabsTrigger value="dashboard">
                            <LayoutDashboard className="mr-2"/> Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="tournaments">
                            <Gamepad2 className="mr-2"/> Tournaments
                        </TabsTrigger>
                        <TabsTrigger value="profile">
                            <UserIcon className="mr-2"/> Profile
                        </TabsTrigger>
                    </TabsList>
                </div>
            </div>
            <div className="mt-4">
              <TabsContent value="dashboard">
                <p className="mb-6 text-muted-foreground">This is your staff dashboard. You can manage tournaments from here.</p>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                      <CardHeader>
                          <CardTitle>Create Tournament</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p>Organize a new tournament for players.</p>
                          <CreateTournamentForm isOpen={isTournamentDialogOpen} setIsOpen={setIsTournamentDialogOpen}>
                                <Button className="mt-4" onClick={() => setIsTournamentDialogOpen(true)}>Create Tournament</Button>
                          </CreateTournamentForm>
                      </CardContent>
                    </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage Tournaments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>View, edit, and update ongoing or upcoming tournaments.</p>
                       <Button className="mt-4" disabled>Manage Tournaments</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="tournaments">
                  <div className="space-y-6">
                      <div>
                          <h3 className="text-xl font-semibold mb-2">All Tournaments</h3>
                          <p className="mb-4 text-muted-foreground">View and manage all active and upcoming tournaments.</p>
                          <TournamentList />
                      </div>
                  </div>
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
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
