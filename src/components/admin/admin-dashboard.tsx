'use client';

import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { useState } from 'react';
import { EditProfileForm } from './edit-profile-form';
import { HireStaffForm } from './hire-staff-form';
import { Gem, LayoutDashboard, User as UserIcon, UserPlus, Stamp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdminDashboard() {
  const { user, profile } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHireDialogOpen, setIsHireDialogOpen] = useState(false);

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
                <TabsTrigger value="hire" className="w-full justify-start gap-2">
                    <UserPlus className="h-5 w-5" />
                    Hire Staff
                </TabsTrigger>
                <TabsTrigger value="approval" className="w-full justify-start gap-2">
                    <Stamp className="h-5 w-5" />
                    Coin Approval
                </TabsTrigger>
                <TabsTrigger value="profile" className="w-full justify-start gap-2">
                    <UserIcon className="h-5 w-5" />
                    Profile
                </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-0 flex-1">
                <p className="mb-6 text-muted-foreground">Welcome, {profile?.username || user?.email || 'Admin'}! Manage your platform from here.</p>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                    <CardHeader>
                        <CardTitle>Create Tournament</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Organize a new tournament for players.</p>
                        <Button className="mt-4" disabled>Coming Soon</Button>
                    </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="hire" className="mt-0 flex-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Hire Staff</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Register a new staff member for the platform.</p>
                        <HireStaffForm isOpen={isHireDialogOpen} setIsOpen={setIsHireDialogOpen}>
                            <Button className="mt-4" onClick={() => setIsHireDialogOpen(true)}>Hire Staff</Button>
                        </HireStaffForm>
                    </CardContent>
                    </Card>
            </TabsContent>
            <TabsContent value="approval" className="mt-0 flex-1">
                 <p className="mb-6 text-muted-foreground">Approve or deny player requests for coin purchases and withdrawals.</p>
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Coin Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Approve or deny player requests to add coins.</p>
                            <Button className="mt-4" disabled>Coming Soon</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Withdraw Coin Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Approve or deny player requests to withdraw coins.</p>
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
