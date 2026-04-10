import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/agent-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const agent = await requireAgentAuth(request);
    const supabase = createAdminClient();
    const taskId = request.nextUrl.searchParams.get('taskId');

    let query = supabase
      .from('agent_messages')
      .select('*')
      .eq('user_id', agent.user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (taskId) {
      query = query.eq('task_id', taskId);
    } else {
      query = query.or(`to_agent_id.is.null,to_agent_id.eq.${agent.id},from_agent_id.eq.${agent.id}`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await requireAgentAuth(request);
    const supabase = createAdminClient();
    const payload = await request.json();

    const { data, error } = await supabase
      .from('agent_messages')
      .insert({
        user_id: agent.user_id,
        from_agent_id: agent.id,
        to_agent_id: payload.toAgentId || null,
        task_id: payload.taskId || null,
        body: payload.body,
        channel: payload.channel || (payload.taskId ? 'task' : payload.toAgentId ? 'direct' : 'global'),
        created_by: 'agent',
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase
      .from('agents')
      .update({
        status: 'online',
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', agent.id);

    return NextResponse.json({ message: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
