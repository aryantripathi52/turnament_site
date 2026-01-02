'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Swords } from 'lucide-react';

export function MyTournaments() {
  // Placeholder data. In the future, this will be fetched from Firestore.
  const joinedTournaments = [
    { id: '1', name: 'Summer Skirmish', status: 'Ongoing' },
    { id: '2', name: 'Winter Warfare', status: 'Upcoming' },
  ];

  const wonTournaments = [
    { id: '3', name: 'Spring Open', placement: '1st Place', prize: 25000 },
  ];

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
          {joinedTournaments.length > 0 ? (
            <div className="space-y-4">
              {joinedTournaments.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-4 border rounded-md">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-sm text-muted-foreground">{t.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center p-4">You haven't joined any tournaments yet.</p>
          )}
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
          {wonTournaments.length > 0 ? (
            <div className="space-y-4">
              {wonTournaments.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-4 border rounded-md bg-yellow-500/10">
                    <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-sm text-yellow-600">{t.placement}</p>
                    </div>
                  <span className="font-bold text-yellow-500">+{t.prize.toLocaleString()} Coins</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center p-4">No tournament wins recorded yet. Keep playing!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
