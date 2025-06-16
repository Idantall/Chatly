import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Ensure this client can work server-side or replace
import { streamText } from 'ai'; // Core function from Vercel AI SDK
import { createOpenAI } from '@ai-sdk/openai'; // OpenAI provider for Vercel AI SDK
import type { Message as VercelAIMessage } from 'ai';

export const runtime = 'edge';

interface AskApiRequestBody {
  chatId?: string;
  persona?: { system_prompt?: string; [key: string]: any };
  messages: VercelAIMessage[];
  userId: string;
  dynamicRuleset?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { persona, messages, userId, dynamicRuleset } = body as AskApiRequestBody;

    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    if (!messages || messages.length === 0) return NextResponse.json({ error: 'Messages are required' }, { status: 400 });

    // Note: Supabase client for server-side needs careful handling for auth & RLS.
    // The browser client from @/lib/supabase might not work as expected here.
    // Consider creating a service role client if needed.
    const supabaseClientToUse = supabase;
    let userProvidedKeyValue: string | undefined;

    const { data: userApiKeyData, error: userApiKeyError } = await supabaseClientToUse
      .from('api_keys')
      .select('key_value')
      .eq('user_id', userId);

    if (userApiKeyError) {
      console.error('Error fetching user API key:', userApiKeyError.message);
    }
    
    // נשתמש במפתח הראשון אם קיים
    userProvidedKeyValue = userApiKeyData?.[0]?.key_value ?? undefined;
    
    // במקרה שנרצה להשתמש במפתח API מהפרסונה כגיבוי
    if (!userProvidedKeyValue && persona?.apiKey) {
      userProvidedKeyValue = persona.apiKey;
    }

    let systemMessage: string | undefined = persona?.system_prompt;
    
    console.log('API: Received dynamicRuleset:', dynamicRuleset);
    
    // הוספת כללים דינמיים להודעת המערכת אם קיימים
    if (dynamicRuleset && dynamicRuleset.trim()) {
      systemMessage = systemMessage ? `${systemMessage}${dynamicRuleset}` : dynamicRuleset;
      console.log('API: Updated systemMessage with ruleset:', systemMessage);
    }

    // Determine which OpenAI client and API key to use
    let openaiClient;

    if (userProvidedKeyValue && userProvidedKeyValue.startsWith('sk-')) {
      openaiClient = createOpenAI({ apiKey: userProvidedKeyValue });
    } else if (process.env.OPENAI_API_KEY && !(userProvidedKeyValue && (userProvidedKeyValue.startsWith('http://') || userProvidedKeyValue.startsWith('https://')))) {
      // Use server's OpenAI key if no user sk- key AND no user custom URL is provided
      openaiClient = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    // If user provided a custom URL, we handle it differently (not using EdgeOpenAI directly for it)
    else if (userProvidedKeyValue && (userProvidedKeyValue.startsWith('http://') || userProvidedKeyValue.startsWith('https://'))) {
      const endpoint = userProvidedKeyValue;
      const currentMessage = messages[messages.length - 1];
      // remove id and createdAt from messages before sending to external API, if they are not expected
      const history = messages.slice(0, -1).map(m => ({role: m.role, content: m.content})); 
      const externalPayload = {
        question: currentMessage.content,
        history: history, 
        persona: persona,
        dynamicRuleset: dynamicRuleset
      };
      
      try {
        const externalRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(externalPayload),
        });

        if (!externalRes.ok) {
          const errorText = await externalRes.text();
          console.error(`External API error (${externalRes.status}): ${errorText}`);
          return NextResponse.json({ error: `External API error: ${errorText}` }, { status: externalRes.status });
        }
        
        if (externalRes.body) {
             return new Response(externalRes.body, {
                headers: { 'Content-Type': externalRes.headers.get('Content-Type') || 'text/plain' },
                status: externalRes.status
            });
        }
        const responseData = await externalRes.text();
        return new Response(responseData, {
            headers: { 'Content-Type': 'text/plain' },
            status: 200
        });

      } catch (fetchError: any) {
        console.error('Error fetching from external RAG API:', fetchError);
        return NextResponse.json({ error: `Failed to connect to external API: ${fetchError.message}` }, { status: 500 });
      }
    } else {
      // This case means no user sk- key, no server OpenAI key, and no user custom URL.
      return NextResponse.json({ error: 'API key not configured.' }, { status: 400 });
    }

    // If we are using an OpenAI client (either user's or server's)
    if (openaiClient) {
        const result = await streamText({
            model: openaiClient.chat('gpt-3.5-turbo'), // Or other model user intends
            messages: messages as VercelAIMessage[], // streamText accepts VercelAIMessage[]
            system: systemMessage,
        });
        
        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const textPart of result.textStream) {
                    controller.enqueue(new TextEncoder().encode(textPart));
                }
                controller.close();
            }
        });
        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
    
    // Fallback if no client was initialized (should be caught by earlier check)
    return NextResponse.json({ error: 'API client could not be initialized or no valid API path taken.' }, { status: 500 });

  } catch (err: any) {
    console.error('Error in /api/ask:', err.stack || err.message);
    return NextResponse.json({ error: err.message || 'An unexpected server error occurred' }, { status: 500 });
  }
} 