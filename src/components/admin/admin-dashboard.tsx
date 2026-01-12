
'use client';

import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { useState } from 'react';
import { EditProfileForm } from './edit-profile-form';
import { Gem, LayoutDashboard, User as UserIcon, Gamepad2, Coins, UserPlus, ListOrdered } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateCategoryForm } from './create-category-form';
import { CategoryList } from './category-list';
import { CreateTournamentForm } from './create-tournament-form';
import { TournamentList } from './tournament-list';
import { StaffCoinRequests } from '../staff/staff-coin-requests';
import { HireStaffForm } from './hire-staff-form';
import { AdminHistory } from './admin-history';
import { useToast } from '@/hooks/use-toast';

export function AdminDashboard() {
  const { user, profile } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    const auth = getAuth();
    try {
        await signOut(auth); // Sign out from client
        // Call the API route to clear the server-side session cookie
        await fetch('/api/session', { method: 'DELETE' });
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        window.location.href = '/login'; // Force a full page reload to clear all state
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
            <CardTitle>Admin Dashboard</CardTitle>
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
                            <TabsTrigger value="coin-requests">
                                <Coins className="mr-2"/> Coin Requests
                            </TabsTrigger>
                            <TabsTrigger value="history">
                                <ListOrdered className="mr-2"/> History
                            </TabsTrigger>
                             <TabsTrigger value="hire-staff">
                                <UserPlus className="mr-2"/> Hire Staff
                            </TabsTrigger>
                            <TabsTrigger value="profile">
                                <UserIcon className="mr-2"/> Profile
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <div className="mt-4">
                    <TabsContent value="dashboard">
                        <p className="mb-6 text-muted-foreground">Welcome, {profile?.username || user?.email || 'Admin'}! Manage your platform from here.</p>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                                    <CardTitle>Create Category</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>Add and manage game categories.</p>
                                    <CreateCategoryForm isOpen={isCategoryDialogOpen} setIsOpen={setIsCategoryDialogOpen}>
                                        <Button className="mt-4" onClick={() => setIsCategoryDialogOpen(true)}>Add Category</Button>
                                    </CreateCategoryForm>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hire Staff</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>Create a new staff account.</p>
                                     <Button className="mt-4" disabled>Hire Staff</Button>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Existing Categories</h3>
                        <CategoryList />
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
                    <TabsContent value="coin-requests">
                        <StaffCoinRequests />
                    </TabsContent>
                    <TabsContent value="history">
                        <AdminHistory />
                    </TabsContent>
                    <TabsContent value="hire-staff">
                        <HireStaffForm />
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
