'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Swords } from 'lucide-react';

export function MyTournaments() {
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
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
                 <p className="font-semibold text-lg mb-2">You haven't joined any tournaments yet.</p>
                 <p>What are you waiting for? Join now and start winning!</p>
            </div>
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
