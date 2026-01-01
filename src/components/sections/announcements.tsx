import { announcements } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export function Announcements() {
  return (
    <section id="announcements" className="py-12 md:py-20 bg-background">
      <div className="container max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center font-headline mb-8">
          Announcements
        </h2>
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="transition-all hover:shadow-md hover:border-primary/50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-primary"/>
                      {announcement.title}
                    </CardTitle>
                    <CardDescription className="pt-1">
                      {new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
