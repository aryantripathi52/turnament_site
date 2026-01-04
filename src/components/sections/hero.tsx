import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export function Hero() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

  return (
    <section className="relative h-screen w-full">
      {/* Background Container: This div isolates the image and its overlay */}
      <div className="absolute inset-0 z-10 bg-black/60">
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
      </div>

      {/* Content Container: This sits on top of the background */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center text-center">
        <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-headline text-white drop-shadow-lg">
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
      </div>
    </section>
  );
}
