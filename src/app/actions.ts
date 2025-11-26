'use server';

import { 
  analyzeHtmlForImprovements,
  type AnalyzeHtmlForImprovementsOutput
} from '@/ai/flows/analyze-html-for-improvements';
import {
  fixHtmlCode,
  type FixHtmlCodeInput,
  type FixHtmlCodeOutput,
} from '@/ai/flows/fix-html-code';

export async function analyzeHtml(htmlCode: string): Promise<AnalyzeHtmlForImprovementsOutput | null> {
  try {
    if (!htmlCode) {
      // In a real app, you might want more robust validation
      throw new Error("HTML code is empty.");
    }
    const result = await analyzeHtmlForImprovements(htmlCode);
    return result;
  } catch (error) {
    console.error("Error analyzing HTML:", error);
    // Depending on the desired error handling, you could return null,
    // throw the error, or return a structured error object.
    return null;
  }
}

export async function fixHtml(input: FixHtmlCodeInput): Promise<FixHtmlCodeOutput | null> {
  try {
    if (!input.htmlCode || input.suggestions.length === 0) {
      throw new Error("HTML code or suggestions are empty.");
    }
    const result = await fixHtmlCode(input);
    return result;
  } catch (error) {
    console.error("Error fixing HTML:", error);
    return null;
  }
}
