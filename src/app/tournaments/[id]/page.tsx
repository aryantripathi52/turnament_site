
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Trophy, Gem, ShieldCheck } from 'lucide-react';
import { getSdks } from '@/firebase/server';
import type { Tournament } from '@/lib/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { PointsTable } from '@/components/tournaments/points-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Helper to format dates safely
const formatDate = (date: any) => {
  if (!date) return 'N/A';
  let d: Date;
  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (date.seconds) {
    d = new Date(date.seconds * 1000);
  } else {
    return 'Invalid Date';
  }
  return format(d, 'PPp');
};


// Fetch data on the server
async function getTournament(id: string): Promise<Tournament | null> {
  const { firestore } = getSdks();
  const tournamentRef = doc(firestore, 'tournaments', id);
  const tournamentSnap = await getDoc(tournamentRef);

  if (!tournamentSnap.exists()) {
    return null;
  }

  return { id: tournamentSnap.id, ...tournamentSnap.data() } as Tournament;
}

export default async function TournamentDetailPage({ params }: { params: { id: string } }) {
  const tournament = await getTournament(params.id);

  if (!tournament) {
    notFound();
  }

  const isFull = tournament.registeredCount >= tournament.maxPlayers;
  const isRegistrationClosed = tournament.status !== 'upcoming';

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-bold">{tournament.name}</CardTitle>
            <Badge variant="secondary" className="capitalize">{tournament.status}</Badge>
          </div>
          <CardDescription>
            Starts: {formatDate(tournament.startDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="points">Points Table</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6 space-y-6">
              <p className="text-muted-foreground">{tournament.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-lg">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Trophy className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">1st Prize</p>
                    <p className="font-bold">{tournament.prizePoolFirst.toLocaleString()} Coins</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Gem className="h-8 w-8 text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entry Fee</p>
                    <p className="font-bold">{tournament.entryFee.toLocaleString()} Coins</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Users className="h-8 w-8 text-blue-400" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Player Slots</p>
                        <p className="font-bold">{tournament.registeredCount} / {tournament.maxPlayers}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Calendar className="h-8 w-8 text-red-400" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Ends On</p>
                        <p className="font-bold">{formatDate(tournament.endDate)}</p>
                    </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Rules & Regulations</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules || 'Standard tournament rules apply.'}</p>
              </div>
            </TabsContent>
            <TabsContent value="points" className="mt-6">
                <PointsTable tournamentId={tournament.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
            {isFull ? (
                <Button size="lg" className="w-full" disabled>
                    Tournament Full
                </Button>
            ) : isRegistrationClosed ? (
                <Button size="lg" className="w-full" disabled>
                    Registration Closed
                </Button>
            ) : (
                <Button size="lg" className="w-full" disabled>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Join Tournament (Login Required)
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
