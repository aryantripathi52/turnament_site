'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Swords, Calendar, Gem } from 'lucide-react';
import { useUser } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { JoinedTournament } from '@/firebase/auth/use-user';


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

export function MyTournaments() {
  const { joinedTournaments, isProfileLoading, userError } = useUser();

  const renderJoinedTournaments = () => {
    if (isProfileLoading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (userError) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not load your tournaments. Please try again later.</AlertDescription>
            </Alert>
        )
    }

    if (!joinedTournaments || joinedTournaments.length === 0) {
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
                <Card key={tournament.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{tournament.name}</CardTitle>
                             <Badge variant="outline">Joined</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                         <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span>
                                1st Prize: <span className="font-semibold">{tournament.prizePoolFirst.toLocaleString()} Coins</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Gem className="h-4 w-4" />
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
             <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
                <p className="font-semibold text-lg mb-2">No tournament wins recorded yet.</p>
                <p>Keep playing to see your victories here!</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
