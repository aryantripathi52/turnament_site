
'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar, Users, Trophy, Gem, MoreVertical, Trash2, CheckCircle, PlayCircle, XCircle, Clock, KeyRound, Edit } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tournament, Category } from '@/lib/types';
import { Button } from '../ui/button';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ManageTournamentDialog } from './manage-tournament-dialog';
import { SetRoomInfoDialog } from './set-room-info-dialog';
import { UpdatePointsTableDialog } from './update-points-table-dialog';


const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date.seconds) {
    return format(new Date(date.seconds * 1000), 'PPp');
  }
  if (date instanceof Date) {
    return format(date, 'PPp');
  }
  return 'Invalid Date';
};

const statusConfig: { [key in Tournament['status']]: { icon: React.ElementType, label: string, color: string } } = {
  upcoming: { icon: Clock, label: 'Upcoming', color: 'bg-blue-500' },
  live: { icon: PlayCircle, label: 'Live', color: 'bg-green-500' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'bg-gray-500' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'bg-red-500' },
};


export function TournamentList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<WithId<Tournament> | null>(null);
  const [manageTournament, setManageTournament] = useState<WithId<Tournament> | null>(null);
  const [roomInfoTournament, setRoomInfoTournament] = useState<WithId<Tournament> | null>(null);
  const [pointsTableTournament, setPointsTableTournament] = useState<WithId<Tournament> | null>(null);

  const tournamentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tournaments'), orderBy('startDate', 'desc'));
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: tournaments, setData: setTournaments, isLoading: isLoadingTournaments, error: tournamentsError } = useCollection<Tournament>(tournamentsQuery);
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useCollection<Category>(categoriesQuery);

  const categoriesMap = useMemo(() => {
    if (!categories) return new Map<string, string>();
    return new Map(categories.map(cat => [cat.id, cat.name]));
  }, [categories]);

  const isLoading = isLoadingTournaments || isLoadingCategories;
  const error = tournamentsError || categoriesError;

  const handleDeleteTournament = async () => {
    if (!firestore || !tournamentToDelete) return;
    try {
      await deleteDoc(doc(firestore, 'tournaments', tournamentToDelete.id));
      setTournaments(prev => prev?.filter(t => t.id !== tournamentToDelete.id) || null);
      toast({ title: 'Success', description: 'Tournament has been deleted.' });
    } catch (e) {
      console.error("Error deleting tournament: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the tournament.' });
    } finally {
      setDeleteAlertOpen(false);
      setTournamentToDelete(null);
    }
  };
  
  const handleUpdate = (updatedTournament: WithId<Tournament>) => {
    setTournaments(prev => prev?.map(t => t.id === updatedTournament.id ? updatedTournament : t) || null);
  };

  const handleUpdateStatus = async (tournamentId: string, status: Tournament['status']) => {
    if (!firestore) return;
    try {
      const tournamentRef = doc(firestore, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, { status });
      handleUpdate({ ...tournaments!.find(t => t.id === tournamentId)!, status });
      toast({ title: 'Success', description: 'Tournament status has been updated.' });
    } catch (e) {
      console.error("Error updating status: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
    }
  };
  
  const handleClearRoomInfo = async (tournamentId: string) => {
    if (!firestore) return;
    try {
      const tournamentRef = doc(firestore, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, { roomId: null, roomPassword: null });
      handleUpdate({ ...tournaments!.find(t => t.id === tournamentId)!, roomId: undefined, roomPassword: undefined });
      toast({ title: 'Success', description: 'Room info has been cleared.' });
    } catch (e) {
      console.error("Error clearing room info: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not clear room info.' });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Tournaments</AlertTitle>
        <AlertDescription>
          There was a problem loading the tournaments. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-md">
        <p>No tournaments have been created yet.</p>
        <p className="text-sm mt-2">Click "Create Tournament" on the dashboard to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => {
          const statusInfo = statusConfig[tournament.status] || statusConfig.upcoming;
          return (
            <Card key={tournament.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl pr-4">{tournament.name}</CardTitle>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">{categoriesMap.get(tournament.categoryId) || 'Unknown'}</Badge>
                    <Badge className={cn("capitalize text-white", statusInfo.color)}>
                      <statusInfo.icon className="mr-1 h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{tournament.description}</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>
                      Prize: <span className="font-semibold">{tournament.prizePoolFirst.toLocaleString()}</span> (1st)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gem className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Entry Fee: <span className="font-semibold">{tournament.entryFee.toLocaleString()} coins</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Slots: <span className="font-semibold">{tournament.registeredCount} / {tournament.maxPlayers}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Starts: <span className="font-semibold">{formatDate(tournament.startDate)}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" className="w-full" onClick={() => setManageTournament(tournament)}>Manage</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => setRoomInfoTournament(tournament)}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Set Room ID & Pass</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPointsTableTournament(tournament)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Update Points Table</span>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <DropdownMenuItem key={status} onClick={() => handleUpdateStatus(tournament.id, status as Tournament['status'])}>
                            <config.icon className="mr-2 h-4 w-4" />
                            <span>{config.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleClearRoomInfo(tournament.id)}
                      disabled={!tournament.roomId && !tournament.roomPassword}
                    >
                      Clear Room Info
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => {
                        setTournamentToDelete(tournament);
                        setDeleteAlertOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tournament
              <span className="font-semibold"> {tournamentToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTournament} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
       {manageTournament && (
        <ManageTournamentDialog 
          tournament={manageTournament} 
          isOpen={!!manageTournament} 
          setIsOpen={(isOpen) => !isOpen && setManageTournament(null)}
          onTournamentUpdate={handleUpdate}
        />
      )}
      
       {roomInfoTournament && (
        <SetRoomInfoDialog 
          tournament={roomInfoTournament}
          isOpen={!!roomInfoTournament}
          setIsOpen={(isOpen) => !isOpen && setRoomInfoTournament(null)}
          onTournamentUpdate={handleUpdate}
        />
       )}

       {pointsTableTournament && (
        <UpdatePointsTableDialog
          tournament={pointsTableTournament}
          isOpen={!!pointsTableTournament}
          setIsOpen={(isOpen) => !isOpen && setPointsTableTournament(null)}
          onTournamentUpdate={handleUpdate}
        />
       )}
    </>
  );
}
