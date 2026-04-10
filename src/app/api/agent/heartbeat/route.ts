import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/agent-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const agent = await requireAgentAuth(request);
    const payload = await request.json().catch(() => ({}));
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('agents')
      .update({
        status: payload.status || 'online',
        last_seen_at: new Date().toISOString(),
        metadata: payload.metadata || {},
      })
      .eq('id', agent.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, agentId: agent.id, seenAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
