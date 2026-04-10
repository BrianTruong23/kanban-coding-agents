import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface AuthenticatedAgent {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  status: string;
}

export const hashAgentKey = (value: string): string => {
  return createHash('sha256').update(value).digest('hex');
};

export const requireAgentAuth = async (request: NextRequest): Promise<AuthenticatedAgent> => {
  const rawKey = request.headers.get('x-agent-key');
  if (!rawKey) {
    throw new Error('Missing x-agent-key header');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agents')
    .select('id, user_id, name, slug, status')
    .eq('api_key_hash', hashAgentKey(rawKey))
    .single();

  if (error || !data) {
    throw new Error('Invalid agent key');
  }

  return data;
};
