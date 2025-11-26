'use server';

import { 
  analyzeHtmlForImprovements,
  type AnalyzeHtmlForImprovementsOutput
} from '@/ai/flows/analyze-html-for-improvements';

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
