'use server';

/**
 * @fileOverview Analyzes HTML code and provides AI-powered suggestions for improvement.
 *
 * - suggestCodeImprovements -  Analyzes HTML code for errors and provides improvement suggestions.
 * - SuggestCodeImprovementsInput - The input type for suggestCodeImprovements.
 * - SuggestCodeImprovementsOutput - The output type for suggestCodeImprovements.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeImprovementsInputSchema = z.object({
  htmlCode: z
    .string()
    .describe('The HTML code to analyze and provide suggestions for.'),
});

export type SuggestCodeImprovementsInput = z.infer<
  typeof SuggestCodeImprovementsInputSchema
>;

const SuggestCodeImprovementsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of AI-powered suggestions for improving the HTML code.'),
});

export type SuggestCodeImprovementsOutput = z.infer<
  typeof SuggestCodeImprovementsOutputSchema
>;

export async function suggestCodeImprovements(
  input: SuggestCodeImprovementsInput
): Promise<SuggestCodeImprovementsOutput> {
  return suggestCodeImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCodeImprovementsPrompt',
  input: {schema: SuggestCodeImprovementsInputSchema},
  output: {schema: SuggestCodeImprovementsOutputSchema},
  prompt: `You are an AI code assistant that analyzes HTML code for potential improvements.

  Analyze the following HTML code and provide a list of suggestions for improving it. Focus on accessibility, performance, semantic HTML, and common errors.

  HTML Code:
  {{htmlCode}}

  Suggestions:
  `, // Ensure the AI returns an array of suggestions.
});

const suggestCodeImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestCodeImprovementsFlow',
    inputSchema: SuggestCodeImprovementsInputSchema,
    outputSchema: SuggestCodeImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
