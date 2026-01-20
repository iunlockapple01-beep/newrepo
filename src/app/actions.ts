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

export async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = '1003679135';

  if (!botToken || botToken === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    console.error('Telegram bot token is not configured in .env file.');
    // We don't want to block the user flow if notifications fail.
    // So we just log the error on the server and return.
    return { success: false, error: 'Telegram integration is not configured.' };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API error:', result.description);
      return { success: false, error: result.description };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}
