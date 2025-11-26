'use server';
/**
 * @fileOverview This file contains the Genkit flow for fixing HTML code based on a set of suggestions.
 *
 * - fixHtmlCode - A function that takes HTML code and a list of suggestions and returns the fixed HTML code.
 * - FixHtmlCodeInput - The input type for the fixHtmlCode function.
 * - FixHtmlCodeOutput - The return type for the fixHtmlCode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FixHtmlCodeInputSchema = z.object({
  htmlCode: z.string().describe('The original HTML code with issues.'),
  suggestions: z.array(z.string()).describe('A list of suggestions to fix the HTML code.'),
});
export type FixHtmlCodeInput = z.infer<typeof FixHtmlCodeInputSchema>;

const FixHtmlCodeOutputSchema = z.object({
    fixedHtmlCode: z.string().describe('The HTML code with the suggestions applied.')
});
export type FixHtmlCodeOutput = z.infer<typeof FixHtmlCodeOutputSchema>;

export async function fixHtmlCode(input: FixHtmlCodeInput): Promise<FixHtmlCodeOutput> {
  return fixHtmlCodeFlow(input);
}

const fixHtmlCodePrompt = ai.definePrompt({
  name: 'fixHtmlCodePrompt',
  input: { schema: FixHtmlCodeInputSchema },
  output: { schema: FixHtmlCodeOutputSchema },
  prompt: `You are an expert web developer. Your task is to fix the given HTML code based on the provided list of suggestions.
Apply all the suggestions to the best of your ability.
Only return the full, corrected HTML code in the 'fixedHtmlCode' field. Do not include any explanations or markdown formatting.

Original HTML Code:
'''html
{{{htmlCode}}}
'''

Suggestions to apply:
{{#each suggestions}}
- {{{this}}}
{{/each}}
`,
});

const fixHtmlCodeFlow = ai.defineFlow(
  {
    name: 'fixHtmlCodeFlow',
    inputSchema: FixHtmlCodeInputSchema,
    outputSchema: FixHtmlCodeOutputSchema,
  },
  async (input) => {
    const { output } = await fixHtmlCodePrompt(input);
    return output!;
  }
);
