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
              className="h-6 w-6 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.99 12.5C19.86 8.39 16.63 5.14 12.51 5.01C8.39 4.88 5.14 8.12 5.01 12.24C4.88 16.35 8.12 19.6 12.24 19.73C12.33 19.73 12.42 19.73 12.5 19.73C16.61 19.73 19.99 16.34 19.99 12.5ZM15.02 11.02C15.22 9.8 14.28 8.82 13.06 9.02C12.19 9.17 11.53 9.94 11.53 10.83V14.16C11.53 14.53 11.23 14.83 10.86 14.83C10.49 14.83 10.19 14.53 10.19 14.16V11.96C10.19 11.41 9.74 10.96 9.19 10.96C8.64 10.96 8.19 11.41 8.19 11.96V14.16C8.19 15.42 9.21 16.44 10.47 16.44C10.59 16.44 10.7 16.43 10.81 16.41C12.35 16.14 13.43 14.77 13.43 13.2V11.93C13.43 11.52 13.82 11.24 14.22 11.36C14.52 11.44 14.88 11.29 15.02 11.02Z" />
            </svg>
            <span className="font-bold font-headline text-lg">Free Fire Frenzy</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
