import { Hero } from '@/components/sections/hero';
import { Tournaments } from '@/components/sections/tournaments';
import { Announcements } from '@/components/sections/announcements';
import { AIHighlighter } from '@/components/sections/ai-highlighter';

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <AIHighlighter />
      <Tournaments />
      <Announcements />
    </div>
  );
}
