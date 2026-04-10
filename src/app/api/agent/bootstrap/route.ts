import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/agent-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const agent = await requireAgentAuth(request);
    const supabase = createAdminClient();

    const [{ data: peers }, { data: tasks }, { data: recentMessages }] = await Promise.all([
      supabase
        .from('agents')
        .select('id, name, slug, agent_type, transport, runtime_location, telegram_bot, status, last_seen_at')
        .eq('user_id', agent.user_id)
        .order('created_at', { ascending: true }),
      supabase
        .from('tasks')
        .select('id, task_id, title, description, status, sprint, priority, tags, assigned_agent_id, updated_at')
        .eq('user_id', agent.user_id)
        .or(`assigned_agent_id.eq.${agent.id},status.eq.backlog`)
        .order('updated_at', { ascending: false })
        .limit(25),
      supabase
        .from('agent_messages')
        .select('*')
        .eq('user_id', agent.user_id)
        .or(`to_agent_id.is.null,to_agent_id.eq.${agent.id},from_agent_id.eq.${agent.id}`)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

    await supabase
      .from('agents')
      .update({
        status: 'online',
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', agent.id);

    return NextResponse.json({
      agent,
      peers: peers || [],
      tasks: tasks || [],
      recentMessages: recentMessages || [],
      polledAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
