// This file is machine-generated - edit at your own risk.
'use server';
/**
 * @fileOverview Analyzes HTML code for potential improvements and issues.
 *
 * - analyzeHtmlForImprovements - Analyzes HTML code for accessibility, broken links, missing alt text, and semantic HTML opportunities.
 * - AnalyzeHtmlForImprovementsInput - The input type for the analyzeHtmlForImprovements function.
 * - AnalyzeHtmlForImprovementsOutput - The return type for the analyzeHtmlForImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeHtmlForImprovementsInputSchema = z.string().describe('The HTML code to analyze.');
export type AnalyzeHtmlForImprovementsInput = z.infer<typeof AnalyzeHtmlForImprovementsInputSchema>;

const AnalyzeHtmlForImprovementsOutputSchema = z.object({
  accessibilityIssues: z.array(z.string()).describe('A list of accessibility issues found in the HTML code.'),
  brokenLinks: z.array(z.string()).describe('A list of broken links found in the HTML code.'),
  missingAltText: z.array(z.string()).describe('A list of images with missing alt text.'),
  semanticHtmlSuggestions: z.array(z.string()).describe('A list of suggestions for improving semantic HTML.'),
});
export type AnalyzeHtmlForImprovementsOutput = z.infer<typeof AnalyzeHtmlForImprovementsOutputSchema>;

export async function analyzeHtmlForImprovements(input: AnalyzeHtmlForImprovementsInput): Promise<AnalyzeHtmlForImprovementsOutput> {
  return analyzeHtmlForImprovementsFlow(input);
}

const analyzeHtmlForImprovementsPrompt = ai.definePrompt({
  name: 'analyzeHtmlForImprovementsPrompt',
  input: {schema: AnalyzeHtmlForImprovementsInputSchema},
  output: {schema: AnalyzeHtmlForImprovementsOutputSchema},
  prompt: `You are an AI expert in HTML code. Analyze the following HTML code for common errors and potential improvements, including accessibility issues, broken links, missing alt text, and opportunities for semantic HTML. Only include suggestions that are relevant to the website.

HTML Code:
{{{$input}}}`,
});

const analyzeHtmlForImprovementsFlow = ai.defineFlow(
  {
    name: 'analyzeHtmlForImprovementsFlow',
    inputSchema: AnalyzeHtmlForImprovementsInputSchema,
    outputSchema: AnalyzeHtmlForImprovementsOutputSchema,
  },
  async input => {
    const {output} = await analyzeHtmlForImprovementsPrompt(input);
    return output!;
  }
);
