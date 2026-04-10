import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/agent-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const agent = await requireAgentAuth(request);
    const { taskId } = await context.params;
    const payload = await request.json();
    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};

    if (payload.status) updates.status = payload.status;
    if (payload.title) updates.title = payload.title;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.sprint !== undefined) updates.sprint = payload.sprint;
    if (payload.priority) updates.priority = payload.priority;
    if (payload.tags) updates.tags = payload.tags;
    if (payload.claim === true) updates.assigned_agent_id = agent.id;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', agent.user_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (payload.message) {
      await supabase.from('agent_messages').insert({
        user_id: agent.user_id,
        from_agent_id: agent.id,
        task_id: taskId,
        body: payload.message,
        channel: 'task',
        created_by: 'agent',
      });
    }

    await supabase
      .from('agents')
      .update({
        status: payload.status === 'in-progress' ? 'busy' : 'online',
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', agent.id);

    return NextResponse.json({ task: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
