'use server';

/**
 * @fileOverview AI tool that automatically generates match highlights from streamed Free Fire matches.
 *
 * - generateMatchHighlights - A function that handles the match highlight generation process.
 * - GenerateMatchHighlightsInput - The input type for the generateMatchHighlights function.
 * - GenerateMatchHighlightsOutput - The return type for the generateMatchHighlights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMatchHighlightsInputSchema = z.object({
  matchStreamUrl: z.string().describe('URL of the streamed Free Fire match.'),
  viewerCountThreshold: z.number().describe('Minimum viewer count for a play to be considered a highlight.'),
  killCountThreshold: z.number().describe('Minimum kill count in a short period to be considered a highlight.'),
  shoutcasterRemarks: z.string().describe('Remarks or comments from shoutcasters during the match.'),
});
export type GenerateMatchHighlightsInput = z.infer<typeof GenerateMatchHighlightsInputSchema>;

const GenerateMatchHighlightsOutputSchema = z.object({
  highlightReelUrl: z.string().describe('URL of the generated highlight reel.'),
  highlightDescription: z.string().describe('A description of the generated highlights.'),
});
export type GenerateMatchHighlightsOutput = z.infer<typeof GenerateMatchHighlightsOutputSchema>;

export async function generateMatchHighlights(input: GenerateMatchHighlightsInput): Promise<GenerateMatchHighlightsOutput> {
  return generateMatchHighlightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMatchHighlightsPrompt',
  input: {schema: GenerateMatchHighlightsInputSchema},
  output: {schema: GenerateMatchHighlightsOutputSchema},
  prompt: `You are an expert eSports highlight reel creator.

You are provided with a Free Fire match stream URL, viewer count and kill count thresholds, and shoutcaster remarks.

Your task is to identify exciting plays and key moments that would be suitable for a highlight reel. Focus on moments involving popular players and high-stakes engagements.

Create a description and a hypothetical URL for the highlight reel. The URL does not need to be real, just a placeholder.

Match Stream URL: {{{matchStreamUrl}}}
Viewer Count Threshold: {{{viewerCountThreshold}}}
Kill Count Threshold: {{{killCountThreshold}}}
Shoutcaster Remarks: {{{shoutcasterRemarks}}}

Description of Highlight Reel:
Highlight Reel URL:
`,
});

const generateMatchHighlightsFlow = ai.defineFlow(
  {
    name: 'generateMatchHighlightsFlow',
    inputSchema: GenerateMatchHighlightsInputSchema,
    outputSchema: GenerateMatchHighlightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
