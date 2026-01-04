import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden">
      {/* Neon Gradient Background */}
      <div
        className="absolute inset-0 z-0 bg-background"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 50% 50% at 50% 50%, hsl(var(--primary)/0.25), transparent 70%)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4">
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
    </section>
  );
}
