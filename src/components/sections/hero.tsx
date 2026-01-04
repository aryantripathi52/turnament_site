'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function Hero() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 1. The Image (Bottom Layer) */}
      <Image
        src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070"
        alt="Esports Arena"
        fill
        priority
        className="object-cover z-0"
      />

      {/* 2. The Gradient Overlay (Middle Layer) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90 z-10" />

      {/* 3. The Content (Top Layer) */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-headline text-white drop-shadow-lg">
          Welcome to <span className="text-blue-500" style={{ textShadow: '0 0 15px hsl(var(--primary))' }}>Free Fire Frenzy</span>
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
  );
}
