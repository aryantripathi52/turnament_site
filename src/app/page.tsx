import { Hero } from '@/components/sections/hero';
import { AIHighlighter } from '@/components/sections/ai-highlighter';

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <AIHighlighter />
    </div>
  );
}
