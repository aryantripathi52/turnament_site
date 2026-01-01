'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createHighlights, type AIHighlightState } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, Link, CheckCircle, AlertCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';

const initialState: AIHighlightState = { message: null, output: null, errors: {} };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
      {pending ? 'Generating...' : 'Generate Highlights'}
    </Button>
  );
}

export function AIHighlighter() {
  const [state, formAction] = useActionState(createHighlights, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.output) {
      formRef.current?.reset();
    }
  }, [state.output]);

  return (
    <section id="ai-highlighter" className="py-12 md:py-20 bg-background">
      <div className="container max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-2">
                <Bot className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">AI-Powered Highlights</CardTitle>
            <CardDescription>
              Automatically generate highlight reels from Free Fire match streams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matchStreamUrl">Match Stream URL</Label>
                <Input id="matchStreamUrl" name="matchStreamUrl" placeholder="https://www.youtube.com/watch?v=..." />
                {state.errors?.matchStreamUrl && <p className="text-sm text-destructive">{state.errors.matchStreamUrl[0]}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="viewerCountThreshold">Min. Viewer Count</Label>
                  <Input id="viewerCountThreshold" name="viewerCountThreshold" type="number" placeholder="e.g., 1000" />
                  {state.errors?.viewerCountThreshold && <p className="text-sm text-destructive">{state.errors.viewerCountThreshold[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="killCountThreshold">Min. Kill Count</Label>
                  <Input id="killCountThreshold" name="killCountThreshold" type="number" placeholder="e.g., 3" />
                  {state.errors?.killCountThreshold && <p className="text-sm text-destructive">{state.errors.killCountThreshold[0]}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shoutcasterRemarks">Shoutcaster Remarks</Label>
                <Textarea id="shoutcasterRemarks" name="shoutcasterRemarks" placeholder="e.g., 'What an incredible play by PlayerX!'" />
                {state.errors?.shoutcasterRemarks && <p className="text-sm text-destructive">{state.errors.shoutcasterRemarks[0]}</p>}
              </div>
              <SubmitButton />
            </form>
          </CardContent>
          <CardFooter>
            {state.message && state.output && (
              <Alert variant="default" className="w-full bg-secondary">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Highlights Ready!</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">{state.output.highlightDescription}</p>
                  <a
                    href={state.output.highlightReelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent-foreground hover:underline flex items-center gap-2"
                  >
                    <Link className="h-4 w-4"/>
                    View Reel: {state.output.highlightReelUrl}
                  </a>
                </AlertDescription>
              </Alert>
            )}
             {state.message && !state.output && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Error</AlertTitle>
                <AlertDescription>
                  {state.message}
                </AlertDescription>
              </Alert>
            )}
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
