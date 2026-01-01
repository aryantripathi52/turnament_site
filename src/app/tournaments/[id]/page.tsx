import { tournaments } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RegistrationForm } from '@/components/registration-form';
import { TournamentDetails } from '@/components/tournament-details';

export async function generateStaticParams() {
    return tournaments.map((tournament) => ({
      id: tournament.id,
    }));
}

export default function TournamentPage({ params }: { params: { id: string } }) {
  const tournament = tournaments.find(t => t.id === params.id);

  if (!tournament) {
    notFound();
  }

  return (
    <div className="container py-8 md:py-12">
      <Button asChild variant="ghost" className="mb-8">
        <Link href="/#tournaments">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournaments
        </Link>
      </Button>
      <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
        <div className="md:col-span-3">
          <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden mb-6 shadow-lg">
             <Image
                src={tournament.imageUrl}
                alt={`Image for ${tournament.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
                data-ai-hint={tournament.imageHint}
                priority
             />
          </div>
          <TournamentDetails tournament={tournament} />
        </div>
        <div className="md:col-span-2">
          <RegistrationForm tournamentName={tournament.name} />
        </div>
      </div>
    </div>
  );
}
