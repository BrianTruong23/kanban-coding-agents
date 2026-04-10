import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/agent-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const agent = await requireAgentAuth(request);
    const supabase = createAdminClient();
    const includeBacklog = request.nextUrl.searchParams.get('includeBacklog') === 'true';

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', agent.user_id)
      .order('updated_at', { ascending: false });

    if (includeBacklog) {
      query = query.or(`assigned_agent_id.eq.${agent.id},status.eq.backlog`);
    } else {
      query = query.eq('assigned_agent_id', agent.id);
    }

    const { data, error } = await query.limit(50);

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

    return NextResponse.json({ tasks: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
