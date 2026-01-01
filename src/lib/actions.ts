'use server';

import { generateMatchHighlights } from '@/ai/flows/generate-match-highlights';
import { z } from 'zod';

const HighlightSchema = z.object({
  matchStreamUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  viewerCountThreshold: z.coerce.number().min(1, 'Viewer count must be at least 1.'),
  killCountThreshold: z.coerce.number().min(1, 'Kill count must be at least 1.'),
  shoutcasterRemarks: z.string().min(10, 'Remarks must be at least 10 characters long.'),
});

export type AIHighlightState = {
  message?: string | null;
  output?: {
    highlightReelUrl: string;
    highlightDescription: string;
  } | null;
  errors?: {
    matchStreamUrl?: string[];
    viewerCountThreshold?: string[];
    killCountThreshold?: string[];
    shoutcasterRemarks?: string[];
    [key: string]: string[] | undefined;
  }
}

export async function createHighlights(prevState: AIHighlightState, formData: FormData): Promise<AIHighlightState> {
  const validatedFields = HighlightSchema.safeParse({
    matchStreamUrl: formData.get('matchStreamUrl'),
    viewerCountThreshold: formData.get('viewerCountThreshold'),
    killCountThreshold: formData.get('killCountThreshold'),
    shoutcasterRemarks: formData.get('shoutcasterRemarks'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to generate highlights. Please check your input.',
    };
  }

  try {
    const output = await generateMatchHighlights(validatedFields.data);
    return { message: 'Highlights generated successfully!', output };
  } catch (error) {
    console.error(error);
    return { message: 'An error occurred on the server while generating highlights.' };
  }
}
