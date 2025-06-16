import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    // Get chat details
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (chatError || !chatData) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get rulebook entries (training data) - using the actual table structure
    const { data: rulebook, error: rulebookError } = await supabase
      .from('rulebook')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (rulebookError) {
      console.error('Failed to fetch rulebook:', rulebookError);
    }

    // Build ruleset from training data
    const ruleset = rulebook?.map(rule => {
      if (rule.feedback_type === 'like') {
        return `✓ GOOD RESPONSE: "${rule.original_content}"`;
      } else if (rule.feedback_type === 'dislike') {
        return `✗ BAD RESPONSE: "${rule.original_content}"`;
      } else if (rule.feedback_type === 'edit' && rule.new_content) {
        return `📝 EDIT: Original: "${rule.original_content}" → Improved: "${rule.new_content}"`;
      } else if (rule.name && rule.rules) {
        return `📋 RULE: ${rule.name} - ${JSON.stringify(rule.rules)}`;
      }
      return null;
    }).filter(Boolean) || [];

    // Create export data
    const exportData = {
      chat: {
        id: chatData.id,
        title: chatData.title,
        created_at: chatData.created_at,
        persona: chatData.persona
      },
      messages: messages?.map(msg => ({
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at
      })) || [],
      ruleset: ruleset,
      export_date: new Date().toISOString(),
      total_messages: messages?.length || 0,
      total_rules: ruleset.length
    };

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `chatly-export-${chatData.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'chat'}-${timestamp}.json`;

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 