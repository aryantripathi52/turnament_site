import type { Tournament } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Calendar, Contact, GanttChartSquare, Trophy } from 'lucide-react';

type TournamentDetailsProps = {
  tournament: Tournament;
};

export function TournamentDetails({ tournament }: TournamentDetailsProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold font-headline text-primary">{tournament.name}</h1>
      <div className="flex flex-wrap gap-4 text-lg">
        <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-semibold">{tournament.prizePool}</span>
        </div>
        <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-semibold">{new Date(tournament.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <GanttChartSquare className="w-6 h-6 text-primary"/>
            Rules & Format
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          {tournament.rules.map((rule, index) => (
            <li key={index}>{rule}</li>
          ))}
        </ul>
      </div>

       <div className="space-y-2">
            <p className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary"/>
                Registration Deadline:{' '}
                <Badge variant="secondary">{new Date(tournament.registrationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Badge>
            </p>
            <p className="font-semibold flex items-center gap-2">
                <Contact className="w-4 h-4 text-primary"/>
                Contact:{' '}
                <a href={`mailto:${tournament.contact}`} className="text-accent-foreground hover:underline">{tournament.contact}</a>
            </p>
        </div>
    </div>
  );
}
