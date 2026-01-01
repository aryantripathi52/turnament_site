import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Hero() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

  return (
    <section className="relative h-screen w-full flex items-center justify-center text-center">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-headline text-white drop-shadow-lg animate-fade-in-down">
          Welcome to <span className="text-primary">Free Fire Frenzy</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-neutral-200 max-w-2xl mx-auto drop-shadow-sm">
          The ultimate battlefield for aspiring eSports champions. Join tournaments, prove your skill, and rise to the top.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
