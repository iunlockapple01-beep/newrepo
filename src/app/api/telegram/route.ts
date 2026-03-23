import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Log status for Netlify function logs
  console.log('Telegram API called');
  
  if (!botToken || !chatId) {
    console.error('MISSING CONFIG: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set in environment variables.');
    return NextResponse.json(
      { 
        error: 'Telegram configuration is missing on the server.',
        details: 'Ensure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set in Netlify Environment Variables.'
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const message = body.message;

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
      console.error('Telegram API error response:', result);
      return NextResponse.json(
        { error: `Telegram API error: ${result.description}` },
        { status: 500 }
      );
    }

    console.log('Telegram message sent successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
