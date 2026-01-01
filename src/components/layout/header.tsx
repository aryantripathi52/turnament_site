import Link from 'next/link';
import { Flame } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">Free Fire Frenzy</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm lg:gap-6 ml-auto">
            <Link
              href="/#tournaments"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Tournaments
            </Link>
            <Link
              href="/#announcements"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Announcements
            </Link>
          </nav>
      </div>
    </header>
  );
}
