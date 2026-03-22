
import { NextResponse } from 'next/server';

/**
 * Escapes characters for Telegram HTML parse mode to prevent 400 Bad Request.
 */
function escapeHTML(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram bot token or chat ID is not configured.');
    return NextResponse.json(
      { error: 'Telegram bot token or chat ID is not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    let message = body.message;

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API error:', result.description);
      // If HTML parsing failed, try sending as plain text
      if (result.description?.includes('can\'t parse entities')) {
        const fallbackResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message.replace(/<[^>]*>/g, ''), // Strip tags
          }),
        });
        const fallbackResult = await fallbackResponse.json();
        return NextResponse.json({ success: fallbackResult.ok, result: fallbackResult });
      }
      
      return NextResponse.json(
        { error: `Telegram API error: ${result.description}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
  }
}
