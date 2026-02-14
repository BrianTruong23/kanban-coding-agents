import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeTriageItem } from '@/lib/triage-analyzer';
import type {
  TriageItem,
  TriageSource,
  GitHubIssueData,
  CIFailureData,
  ErrorLogData,
  UserFeedbackData,
} from '@/types/triage';

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
    const { source, data: sourceData } = body as {
      source: TriageSource;
      data: GitHubIssueData | CIFailureData | ErrorLogData | UserFeedbackData | Record<string, unknown>;
    };

    if (!source || !sourceData) {
      return NextResponse.json(
        { error: 'Missing required fields: source and data' },
        { status: 400 }
      );
    }

    // Parse source data into triage item
    let triageItem: Partial<TriageItem> = {
      id: `triage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      source,
      rawData: sourceData as Record<string, unknown>,
      status: 'pending',
      tags: [],
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Parse based on source type
    switch (source) {
      case 'github_issue': {
        const ghData = sourceData as GitHubIssueData;
        triageItem.title = ghData.title;
        triageItem.description = ghData.body || '';
        triageItem.tags = ghData.labels;
        triageItem.metadata = {
          sourceUrl: ghData.url,
          githubNumber: ghData.number,
          githubState: ghData.state,
          githubUser: ghData.user.login,
        };
        break;
      }

      case 'ci_failure': {
        const ciData = sourceData as CIFailureData;
        triageItem.title = `CI Failure: ${ciData.jobName}`;
        triageItem.description = ciData.errorMessage || 'CI job failed';
        triageItem.metadata = {
          sourceUrl: ciData.url,
          ciJobId: ciData.jobId,
          branch: ciData.branch,
          commit: ciData.commit,
          errorMessage: ciData.errorMessage,
        };
        triageItem.severity = 'high';
        break;
      }

      case 'error_log': {
        const errorData = sourceData as ErrorLogData;
        triageItem.title = `Error: ${errorData.message}`;
        triageItem.description = errorData.stackTrace || errorData.message;
        triageItem.metadata = {
          stackTrace: errorData.stackTrace,
          errorCode: errorData.errorCode,
          environment: errorData.environment,
          context: errorData.context,
        };
        triageItem.severity = errorData.severity === 'critical' ? 'critical' : 'high';
        break;
      }

      case 'user_feedback': {
        const feedbackData = sourceData as UserFeedbackData;
        triageItem.title = feedbackData.subject;
        triageItem.description = feedbackData.message;
        triageItem.metadata = {
          userEmail: feedbackData.userEmail,
          userAgent: feedbackData.userAgent,
          url: feedbackData.url,
          category: feedbackData.category,
          sentiment: feedbackData.sentiment,
        };
        triageItem.severity = feedbackData.sentiment === 'negative' ? 'medium' : 'low';
        break;
      }

      case 'sentry':
      case 'manual':
      default: {
        triageItem.title = (sourceData as any).title || 'Untitled Issue';
        triageItem.description = (sourceData as any).description || '';
        triageItem.metadata = sourceData as Record<string, unknown>;
        break;
      }
    }

    // Fetch existing items for duplicate detection
    const { data: existingItems } = await supabase
      .from('triage_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('source', source)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: false });

    // Fetch agents for owner suggestion
    const { data: agents } = await supabase
      .from('coding_agents')
      .select('id, name, description')
      .eq('user_id', user.id);

    // Analyze and enrich the triage item
    const enrichedItem = analyzeTriageItem(
      triageItem,
      (existingItems || []).map(item => ({
        ...item,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
        triagedAt: item.triaged_at ? new Date(item.triaged_at).getTime() : undefined,
      })),
      agents || []
    );

    // Insert into database
    const { data: insertedItem, error: insertError } = await supabase
      .from('triage_items')
      .insert({
        id: enrichedItem.id,
        user_id: user.id,
        source: enrichedItem.source,
        title: enrichedItem.title,
        description: enrichedItem.description,
        raw_data: enrichedItem.rawData,
        severity: enrichedItem.severity,
        status: enrichedItem.status,
        duplicate_of_id: enrichedItem.duplicateOfId,
        suggested_owner: enrichedItem.suggestedOwner,
        reproduction_steps: enrichedItem.reproductionSteps,
        tags: enrichedItem.tags,
        metadata: enrichedItem.metadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting triage item:', insertError);
      return NextResponse.json(
        { error: 'Failed to create triage item', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item: insertedItem,
      isDuplicate: enrichedItem.status === 'duplicate',
    });
  } catch (error) {
    console.error('Error in triage ingest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
