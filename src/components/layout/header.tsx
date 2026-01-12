import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <svg
              role="img"
              aria-label="Free Fire Frenzy Logo"
              className="h-7 w-7 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22a2.93 2.93 0 0 0 1.5-5.32l-1-1.74a2.93 2.93 0 0 0-4.94 0l-1 1.74A2.93 2.93 0 0 0 12 22Z" />
              <path d="M16 11.32a2.89 2.89 0 0 0 2.2-4.52L17.15 5.5a2.89 2.89 0 0 0-4.94 0L11.16 7a2.89 2.89 0 0 0 2.2 4.52" />
              <path d="M8 11.32a2.89 2.89 0 0 1-2.2-4.52L6.85 5.5a2.89 2.89 0 0 1 4.94 0L12.84 7a2.89 2.89 0 0 1-2.2 4.52" />
              <path d="M12 2l-1 1.73a2.94 2.94 0 0 0 0 2.54L12 8l1-1.73a2.94 2.94 0 0 0 0-2.54Z" />
            </svg>
            <span className="font-bold font-headline text-lg">Free Fire Frenzy</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
