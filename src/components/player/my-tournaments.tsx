'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trophy, Swords, Calendar, Coins, Info, Ticket, KeyRound, Hash, ArrowLeft, Clock, PlayCircle, CheckCircle, XCircle, Copy, ListOrdered } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { JoinedTournament, WonTournament, Tournament } from '@/lib/types';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date.seconds) {
    return format(new Date(date.seconds * 1000), 'PP');
  }
  if (date instanceof Date) {
    return format(date, 'PP');
  }
  return 'Invalid Date';
};

const statusConfig: { [key in Tournament['status']]: { icon: React.ElementType, label: string, color: string, description: string } } = {
  upcoming: { icon: Clock, label: 'Upcoming', color: 'text-blue-500', description: 'Registration open. Get ready!' },
  live: { icon: PlayCircle, label: 'Live', color: 'text-green-500 animate-pulse', description: 'The tournament is live! Join now!' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'text-gray-500', description: 'This tournament has finished.' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-500', description: 'Cancelled. Your entry fee has been refunded.' },
};

function JoinedTournamentCard({ tournament, userId }: { tournament: JoinedTournament, userId: string }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [liveTournamentData, setLiveTournamentData] = useState<Tournament | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const statusInfo = statusConfig[liveTournamentData?.status || 'upcoming'];
  const isLive = liveTournamentData?.status === 'live';

  useEffect(() => {
    if (!firestore || !tournament.id || !userId) return;

    // Listener for live tournament data (status, room id, etc.)
    const tournamentRef = doc(firestore, 'tournaments', tournament.id);
    const unsubscribeTournament = onSnapshot(tournamentRef, (docSnap) => {
      if (docSnap.exists()) {
        setLiveTournamentData(docSnap.data() as Tournament);
      }
    });

    // Cleanup listeners on component unmount
    return () => {
        unsubscribeTournament();
    };
  }, [firestore, tournament.id, userId]);

  const handleCopy = (text: string | undefined | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'The details have been copied to your clipboard.',
    });
  };

  return (
     <div className="flip-card h-[320px]" >
      <div className={cn("flip-card-inner", isFlipped && "flipped")}>
        <div className="flip-card-front">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{tournament.name}</CardTitle>
                <Badge variant="outline">Joined</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span>
                  1st Prize: <span className="font-semibold">{tournament.prizePoolFirst?.toLocaleString() || '0'} Coins</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span>
                  Entry Fee: <span className="font-semibold text-foreground">{tournament.entryFee.toLocaleString()} coins</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Starts: <span className="font-semibold text-foreground">{formatDate(tournament.startDate)}</span>
                </span>
              </div>
            </CardContent>
            <CardFooter>
                 <Button variant="secondary" className="w-full" onClick={() => setIsFlipped(true)}>See Details & Status</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="flip-card-back">
          <Card className="h-full flex flex-col">
             <CardHeader>
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        <statusInfo.icon className={cn("h-4 w-4", statusInfo.color)} />
                        <span className={cn("font-semibold", isLive && 'font-bold text-green-500')}>{statusInfo.label}</span>
                    </div>
                    <div className={cn("flex items-center gap-2 text-sm", isLive && 'font-bold text-green-500')}>
                        <Hash className="h-4 w-4"/>
                        <span>Slot #{tournament.slotNumber?.toString().padStart(2, '0') || '01'}</span>
                    </div>
                </div>
             </CardHeader>
             <CardContent className="flex-grow flex flex-col justify-center space-y-4">
                {isLive ? (
                    <div className='space-y-3'>
                        <div className="flex items-center gap-3 bg-muted p-3 rounded-md justify-between">
                           <div className="flex items-center gap-3">
                             <Ticket className="h-5 w-5 text-primary" />
                             <div>
                               <p className="text-xs text-muted-foreground">Room ID</p>
                               <p className="font-mono font-bold text-lg">{liveTournamentData?.roomId || 'Pending'}</p>
                             </div>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => handleCopy(liveTournamentData?.roomId)}>
                             <Copy className="h-4 w-4"/>
                           </Button>
                        </div>
                         <div className="flex items-center gap-3 bg-muted p-3 rounded-md justify-between">
                           <div className="flex items-center gap-3">
                             <KeyRound className="h-5 w-5 text-primary" />
                             <div>
                               <p className="text-xs text-muted-foreground">Password</p>
                               <p className="font-mono font-bold text-lg">{liveTournamentData?.roomPassword || 'Pending'}</p>
                             </div>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => handleCopy(liveTournamentData?.roomPassword)}>
                             <Copy className="h-4 w-4"/>
                           </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center justify-center h-full">
                        {liveTournamentData?.status === 'upcoming' && (
                            <p className="text-muted-foreground text-sm p-4">
                                Room details will be shared 15 minutes before the match starts. Good luck!
                            </p>
                        )}
                        {liveTournamentData?.status === 'completed' && (
                            <>
                                <CheckCircle className="h-10 w-10 text-green-500 mb-2"/>
                                <p className="text-muted-foreground text-sm p-4">
                                    The tournament has ended. Check the "Tournament Wins" section for results!
                                </p>
                            </>
                        )}
                        {liveTournamentData?.status === 'cancelled' && (
                            <>
                                <XCircle className="h-10 w-10 text-red-500 mb-2"/>
                                <p className="text-muted-foreground text-sm p-4">
                                    This tournament was cancelled. Your entry fee has been refunded.
                                </p>
                            </>
                        )}
                    </div>
                )}
                 <Button disabled><ListOrdered className="mr-2 h-4 w-4" /> Points Table</Button>
             </CardContent>
             <CardFooter className='flex-col gap-2'>
                <Button variant="secondary" className="w-full" onClick={() => setIsFlipped(false)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
             </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}


export function MyTournaments() {
  const { user, joinedTournaments, wonTournaments, isTournamentsLoading, tournamentsError } = useUser();

  const renderJoinedTournaments = () => {
    if (isTournamentsLoading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-[320px] w-full" />
                <Skeleton className="h-[320px] w-full" />
            </div>
        );
    }

    if (tournamentsError) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not load your tournaments. Please try again later.</AlertDescription>
            </Alert>
        )
    }

    if (!joinedTournaments || joinedTournaments.length === 0 || !user) {
      return (
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
          <p className="font-semibold text-lg mb-2">You haven't joined any tournaments yet.</p>
          <p>What are you waiting for? Join now and start winning!</p>
        </div>
      );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {joinedTournaments.map((tournament) => (
                <JoinedTournamentCard key={tournament.id} tournament={tournament} userId={user.uid} />
            ))}
        </div>
    )
  };

  const renderWonTournaments = () => {
    if (isTournamentsLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (tournamentsError) {
        return null;
    }

    if (!wonTournaments || wonTournaments.length === 0) {
      return (
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
          <p className="font-semibold text-lg mb-2">No tournament wins recorded yet.</p>
          <p>Keep playing to see your victories here!</p>
        </div>
      );
    }

     return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wonTournaments.map((tournament) => (
                <Card key={tournament.id} className="border-yellow-500/50">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{tournament.name}</CardTitle>
                             <Badge className="bg-yellow-500 text-white hover:bg-yellow-500/90">{tournament.place} Place</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                         <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span>
                                Prize Won: <span className="font-semibold">{tournament.prizeWon.toLocaleString()} Coins</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                Completed: <span className="font-semibold text-foreground">{formatDate(tournament.completionDate)}</span>
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-6 w-6 text-primary" />
            Joined Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent>
            {renderJoinedTournaments()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Tournament Wins
          </CardTitle>
        </CardHeader>
        <CardContent>
             {renderWonTournaments()}
        </CardContent>
      </Card>
    </div>
  );
}
