import { NextRequest, NextResponse } from 'next/server';
import type { GitHubIssueData } from '@/types/triage';

/**
 * GitHub Webhook Handler for Issues
 *
 * This endpoint receives GitHub webhook events for issues and forwards them to the triage inbox.
 *
 * Setup:
 * 1. Go to your GitHub repository settings
 * 2. Navigate to Webhooks
 * 3. Add a new webhook with:
 *    - Payload URL: https://your-domain.com/api/webhooks/github
 *    - Content type: application/json
 *    - Secret: Your webhook secret (optional but recommended)
 *    - Events: Just the push event or Let me select individual events (Issues)
 *
 * For testing without a GitHub webhook, you can POST to this endpoint with a sample payload.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // GitHub sends different events, we only care about issues
    const event = request.headers.get('x-github-event');

    if (event !== 'issues' && !body.issue) {
      return NextResponse.json(
        { message: 'Event ignored (not an issue event)' },
        { status: 200 }
      );
    }

    // Extract issue data
    const issue = body.issue;
    const action = body.action; // opened, edited, closed, etc.

    // Only process opened and reopened issues
    if (action !== 'opened' && action !== 'reopened') {
      return NextResponse.json(
        { message: 'Issue action ignored (not opened or reopened)' },
        { status: 200 }
      );
    }

    // Transform GitHub issue to our format
    const githubData: GitHubIssueData = {
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      state: issue.state,
      labels: issue.labels?.map((l: any) => l.name) || [],
      assignees: issue.assignees?.map((a: any) => a.login) || [],
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      url: issue.html_url,
      user: {
        login: issue.user?.login || 'unknown',
        avatar_url: issue.user?.avatar_url || '',
      },
    };

    // Get user_id from query params (for testing) or use a default
    // In production, you'd want to map this to a specific user based on the repository
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id query parameter required for authentication' },
        { status: 400 }
      );
    }

    // Forward to the triage ingest API
    const ingestUrl = new URL('/api/triage/ingest', request.url);
    const ingestResponse = await fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the authorization header if present
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!,
        }),
      },
      body: JSON.stringify({
        source: 'github_issue',
        data: githubData,
      }),
    });

    if (!ingestResponse.ok) {
      const error = await ingestResponse.json();
      console.error('Failed to ingest GitHub issue:', error);
      return NextResponse.json(
        { error: 'Failed to ingest issue', details: error },
        { status: 500 }
      );
    }

    const result = await ingestResponse.json();

    return NextResponse.json({
      message: 'GitHub issue processed successfully',
      result,
    });
  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Test endpoint - GET request returns sample payload for testing
 */
export async function GET() {
  const samplePayload = {
    action: 'opened',
    issue: {
      number: 123,
      title: 'Sample issue from GitHub',
      body: 'This is a sample issue created for testing the webhook integration.\n\nSteps to reproduce:\n1. Do something\n2. See error',
      state: 'open',
      labels: [
        { name: 'bug' },
        { name: 'priority:high' },
      ],
      assignees: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      html_url: 'https://github.com/example/repo/issues/123',
      user: {
        login: 'testuser',
        avatar_url: 'https://github.com/testuser.png',
      },
    },
  };

  return NextResponse.json({
    message: 'GitHub webhook test endpoint',
    usage: 'POST this payload to /api/webhooks/github?user_id=YOUR_USER_ID with your auth token',
    samplePayload,
  });
}
