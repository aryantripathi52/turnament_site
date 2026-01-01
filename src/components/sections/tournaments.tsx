import Link from 'next/link';
import Image from 'next/image';
import { tournaments } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Trophy } from 'lucide-react';

export function Tournaments() {
  return (
    <section id="tournaments" className="py-12 md:py-20 bg-card">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center font-headline mb-8">
          Upcoming Tournaments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="flex flex-col overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-primary/20 shadow-lg">
              <div className="relative h-48 w-full">
                <Image
                  src={tournament.imageUrl}
                  alt={`Image for ${tournament.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  data-ai-hint={tournament.imageHint}
                />
                <div className="absolute bottom-0 left-0 bg-primary/80 text-primary-foreground px-3 py-1 text-sm font-bold rounded-tr-md">
                    {tournament.region}
                </div>
              </div>
              <CardHeader>
                <CardTitle className="font-headline">{tournament.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{new Date(tournament.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span>{tournament.prizePool} Prize Pool</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                  <Link href={`/tournaments/${tournament.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
