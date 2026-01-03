'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { Gem, LayoutDashboard, User as UserIcon, Gamepad2, PanelLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { EditProfileForm } from '../admin/edit-profile-form';
import { TournamentList } from '../admin/tournament-list';
import { CreateTournamentForm } from '../admin/create-tournament-form';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';


export function StaffDashboard() {
  const { user, profile } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsMobileMenuOpen(false); // Close menu on tab selection
  };

  const creationDate = user?.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString()
    : 'N/A';

  const NavTabs = () => (
     <TabsList className="grid w-full grid-cols-1 md:flex md:flex-col md:h-full md:space-y-2">
        <TabsTrigger value="dashboard" onClick={() => handleTabChange('dashboard')} className="w-full justify-start gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
        </TabsTrigger>
        <TabsTrigger value="tournaments" onClick={() => handleTabChange('tournaments')} className="w-full justify-start gap-2">
                <Gamepad2 className="h-5 w-5" />
                Tournaments
            </TabsTrigger>
        <TabsTrigger value="profile" onClick={() => handleTabChange('profile')} className="w-full justify-start gap-2">
            <UserIcon className="h-5 w-5" />
            Profile
        </TabsTrigger>
    </TabsList>
  );

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden">
                          <PanelLeft className="h-5 w-5" />
                          <span className="sr-only">Open menu</span>
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-60 p-4">
                      <div className="flex flex-col h-full">
                          <h3 className="text-lg font-semibold mb-4">Menu</h3>
                          <NavTabs />
                      </div>
                  </SheetContent>
              </Sheet>
              <CardTitle>Welcome, {profile?.username || user?.email || 'Staff'}</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-primary" />
              <span className="font-semibold">{profile?.coins ?? 0}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row md:gap-8">
            <div className="hidden md:flex md:w-auto md:flex-shrink-0">
                <NavTabs />
            </div>
            <div className="mt-4 md:mt-0 flex-1">
              <TabsContent value="dashboard">
                <p className="mb-6 text-muted-foreground">This is your staff dashboard. You can manage tournaments and player coin requests from here.</p>
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
                      <Button className="mt-4" onClick={() => setActiveTab('tournaments')}>
                        Manage Tournaments
                      </Button>
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
