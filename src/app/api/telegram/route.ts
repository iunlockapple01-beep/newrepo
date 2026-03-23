import { NextResponse } from 'next/server';

export async function GET() {
  // Status check endpoint to verify configuration
  return NextResponse.json({ 
    status: 'Telegram API Route is Active',
    config_status: {
      bot_token_set: !!process.env.TELEGRAM_BOT_TOKEN,
      chat_id_set: !!process.env.TELEGRAM_CHAT_ID,
      token_preview: process.env.TELEGRAM_BOT_TOKEN ? `${process.env.TELEGRAM_BOT_TOKEN.slice(0, 5)}...` : 'none'
    }
  });
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('TELEGRAM CONFIG ERROR: Missing credentials in environment variables.');
    return NextResponse.json(
      { 
        error: 'Telegram credentials missing on server.',
        help: 'Ensure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set in your hosting dashboard (Netlify/Vercel).'
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const message = body.message;

    if (!message) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('TELEGRAM API REJECTION:', result);
      return NextResponse.json(
        { error: `Telegram API Error: ${result.description}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('TELEGRAM ROUTE CRASH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown internal error' },
      { status: 500 }
    );
  }
}
