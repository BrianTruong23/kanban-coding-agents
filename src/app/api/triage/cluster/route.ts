import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clusterTriageItems } from '@/lib/triage-analyzer';
import type { TriageItem } from '@/types/triage';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { similarityThreshold = 0.3 } = body;

    // Fetch pending triage items
    const { data: items, error: fetchError } = await supabase
      .from('triage_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .is('cluster_id', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch triage items', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: true,
        clusters: [],
        message: 'No items to cluster',
      });
    }

    // Convert to TriageItem format
    const triageItems: TriageItem[] = items.map(item => ({
      ...item,
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.updated_at).getTime(),
      triagedAt: item.triaged_at ? new Date(item.triaged_at).getTime() : undefined,
    }));

    // Cluster items
    const clusters = clusterTriageItems(triageItems, similarityThreshold);

    // Insert clusters and update items
    const insertedClusters = [];

    for (const cluster of clusters) {
      // Insert cluster
      const { data: insertedCluster, error: clusterError } = await supabase
        .from('triage_clusters')
        .insert({
          id: cluster.id,
          user_id: user.id,
          title: cluster.title,
          description: cluster.description,
          item_ids: cluster.itemIds,
          severity: cluster.severity,
          suggested_owner: cluster.suggestedOwner,
          common_patterns: cluster.commonPatterns,
          reproduction_steps: cluster.reproductionSteps,
          tags: cluster.tags,
        })
        .select()
        .single();

      if (clusterError) {
        console.error('Error inserting cluster:', clusterError);
        continue;
      }

      insertedClusters.push(insertedCluster);

      // Update items to reference cluster
      const { error: updateError } = await supabase
        .from('triage_items')
        .update({ cluster_id: cluster.id })
        .in('id', cluster.itemIds);

      if (updateError) {
        console.error('Error updating items with cluster_id:', updateError);
      }

      // Mark duplicate items
      if (cluster.itemIds.length > 1) {
        const [originalId, ...duplicateIds] = cluster.itemIds;

        const { error: duplicateError } = await supabase
          .from('triage_items')
          .update({
            status: 'duplicate',
            duplicate_of_id: originalId,
          })
          .in('id', duplicateIds);

        if (duplicateError) {
          console.error('Error marking duplicates:', duplicateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      clusters: insertedClusters,
      clustersCount: insertedClusters.length,
      itemsClustered: clusters.reduce((sum, c) => sum + c.itemIds.length, 0),
    });
  } catch (error) {
    console.error('Error in triage clustering:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
