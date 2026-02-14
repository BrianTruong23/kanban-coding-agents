# Auto-Triage Inbox Documentation

## Overview

The Auto-Triage Inbox is an intelligent system that automatically ingests, analyzes, clusters, and categorizes issues from multiple sources including GitHub, CI/CD failures, error logs, and user feedback.

## Features

### 1. **Multi-Source Ingestion**
- **GitHub Issues**: Direct integration with GitHub webhooks
- **CI/CD Failures**: Ingest failed build/test logs
- **Error Logs**: Application error tracking
- **User Feedback**: Customer support and feedback
- **Sentry**: Error monitoring integration
- **Manual Entry**: Direct input for custom items

### 2. **Automatic Analysis**
- **Severity Detection**: Automatically labels items as critical, high, medium, low, or info
- **Smart Clustering**: Groups similar issues together using text similarity
- **Duplicate Detection**: Identifies and marks duplicate issues
- **Tag Suggestion**: Auto-tags items based on content (frontend, backend, bug, etc.)
- **Owner Recommendation**: Suggests the best agent to handle each item

### 3. **Minimal Reproduction Steps**
- Automatically extracts reproduction steps from issue descriptions
- Generates steps from CI/CD failures and error logs
- Provides structured format for developers

### 4. **Workflow Management**
- Track items through their lifecycle: pending → triaged → assigned → resolved
- Convert triage items to tasks on the Kanban board
- Assign items to specific agents
- Update severity and status

## Getting Started

### Access the Triage Inbox

1. Navigate to the main Kanban board
2. Click the "Triage" button in the header
3. The inbox will load with all your triage items

### Ingesting Data

#### From GitHub (Webhook)

1. **Setup Webhook**:
   ```
   URL: https://your-domain.com/api/webhooks/github?user_id=YOUR_USER_ID
   Content Type: application/json
   Events: Issues
   ```

2. **Test the Integration**:
   ```bash
   curl -X POST https://your-domain.com/api/webhooks/github?user_id=YOUR_USER_ID \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "action": "opened",
       "issue": {
         "number": 123,
         "title": "Bug: Application crashes on login",
         "body": "Steps to reproduce:\n1. Open login page\n2. Enter credentials\n3. Click submit\n4. App crashes",
         "state": "open",
         "labels": [{"name": "bug"}],
         "created_at": "2024-01-01T00:00:00Z",
         "updated_at": "2024-01-01T00:00:00Z",
         "html_url": "https://github.com/repo/issues/123",
         "user": {"login": "testuser"}
       }
     }'
   ```

#### From CI/CD

```bash
curl -X POST https://your-domain.com/api/triage/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "source": "ci_failure",
    "data": {
      "jobId": "build-123",
      "jobName": "Unit Tests",
      "branch": "main",
      "commit": "abc123",
      "status": "failed",
      "errorMessage": "Test suite failed with 3 errors",
      "logs": "Error: Expected true to be false...",
      "startTime": "2024-01-01T00:00:00Z",
      "endTime": "2024-01-01T00:05:00Z",
      "url": "https://ci.example.com/jobs/123"
    }
  }'
```

#### From Error Logs

```bash
curl -X POST https://your-domain.com/api/triage/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "source": "error_log",
    "data": {
      "message": "TypeError: Cannot read property of undefined",
      "stackTrace": "at Component.render (App.tsx:42:15)...",
      "errorCode": "ERR_UNDEFINED",
      "severity": "error",
      "timestamp": "2024-01-01T00:00:00Z",
      "environment": "production",
      "context": {
        "userId": "user123",
        "page": "/dashboard"
      }
    }
  }'
```

#### From User Feedback

```bash
curl -X POST https://your-domain.com/api/triage/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "source": "user_feedback",
    "data": {
      "subject": "Feature Request: Dark Mode",
      "message": "It would be great to have a dark mode option for the app",
      "userEmail": "user@example.com",
      "timestamp": "2024-01-01T00:00:00Z",
      "category": "feature-request",
      "sentiment": "positive"
    }
  }'
```

## Using the Interface

### Viewing Items

The triage inbox displays all items in a list view with:
- **Severity indicator**: Color-coded icons (red for critical, orange for high, etc.)
- **Source badge**: Shows where the item came from
- **Title and description**: Key information about the item
- **Tags**: Auto-generated and custom tags
- **Status**: Current workflow state

### Filtering

Use the filter panel to narrow down items by:
- **Search**: Text search in title and description
- **Status**: pending, triaged, assigned, duplicate, resolved, ignored
- **Source**: Filter by where items came from
- **Severity**: Filter by importance level

### Statistics

The stats panel shows:
- Total items
- Breakdown by status
- Breakdown by severity
- Breakdown by source
- Number of clusters
- Average triage time

### Managing Items

#### Expand an Item
Click the chevron icon to see full details including:
- Reproduction steps
- Metadata
- All available actions

#### Change Severity
Select the appropriate severity level from the dropdown

#### Update Status
Change the workflow status:
- **Pending**: Not yet reviewed
- **Triaged**: Reviewed and categorized
- **Assigned**: Assigned to an agent
- **Duplicate**: Marked as duplicate of another item
- **Resolved**: Issue has been fixed
- **Ignored**: Not actionable

#### Assign to Agent
Select an agent from the dropdown to assign the item

#### Convert to Task
Click "Convert to Task" to create a new task on the Kanban board with:
- Same title and description
- Mapped priority (based on severity)
- Same tags
- Pre-assigned to the suggested agent

### Clustering

Click the "Cluster" button to automatically:
1. Group similar items together
2. Mark duplicates
3. Create cluster summaries
4. Extract common patterns

The clustering algorithm uses text similarity to find related issues, making it easier to:
- Identify duplicate reports
- Batch process similar issues
- Understand common problem areas

## Database Schema

### triage_items
- **id**: Unique identifier
- **user_id**: Owner of the item
- **source**: Where the item came from
- **title**: Item title
- **description**: Full description
- **raw_data**: Original data from source
- **severity**: critical | high | medium | low | info
- **status**: pending | triaged | assigned | duplicate | resolved | ignored
- **cluster_id**: Reference to cluster (if grouped)
- **duplicate_of_id**: Reference to original (if duplicate)
- **suggested_owner**: Recommended agent ID
- **reproduction_steps**: Array of steps to reproduce
- **tags**: Array of tags
- **metadata**: Additional structured data
- **assigned_task_id**: Reference to created task (if converted)
- **created_at**: Creation timestamp
- **updated_at**: Last update timestamp
- **triaged_at**: When it was triaged

### triage_clusters
- **id**: Unique identifier
- **user_id**: Owner of the cluster
- **title**: Cluster title
- **description**: Summary
- **item_ids**: Array of item IDs in this cluster
- **severity**: Highest severity in cluster
- **suggested_owner**: Recommended agent
- **common_patterns**: Key terms found across items
- **reproduction_steps**: Merged steps
- **tags**: Combined tags
- **created_at**: Creation timestamp
- **updated_at**: Last update timestamp

## API Reference

### POST /api/triage/ingest
Ingest a new item into the triage inbox.

**Request Body**:
```json
{
  "source": "github_issue" | "ci_failure" | "error_log" | "user_feedback" | "sentry" | "manual",
  "data": { /* source-specific data */ }
}
```

**Response**:
```json
{
  "success": true,
  "item": { /* created item */ },
  "isDuplicate": false
}
```

### POST /api/triage/cluster
Trigger clustering of pending items.

**Request Body**:
```json
{
  "similarityThreshold": 0.3  // 0-1, higher = stricter matching
}
```

**Response**:
```json
{
  "success": true,
  "clusters": [ /* created clusters */ ],
  "clustersCount": 5,
  "itemsClustered": 23
}
```

## Advanced Configuration

### Customizing Severity Detection

Edit `/src/lib/triage-analyzer.ts` and modify the `detectSeverity` function to add custom rules.

### Customizing Tag Suggestions

Edit the `suggestTags` function in `/src/lib/triage-analyzer.ts` to add domain-specific tags.

### Customizing Agent Matching

Edit the `suggestOwner` function to implement your team's assignment logic.

### Adjusting Clustering Threshold

Lower values (0.1-0.3) create larger, more inclusive clusters.
Higher values (0.5-0.8) create smaller, more precise clusters.

## Best Practices

1. **Regular Clustering**: Run clustering daily or after ingesting multiple items
2. **Quick Triage**: Review pending items regularly to maintain velocity
3. **Use Tags**: Consistent tagging helps with filtering and organization
4. **Set Up Webhooks**: Automate ingestion from all your sources
5. **Track Metrics**: Monitor average triage time and resolution rates
6. **Convert Important Items**: Turn triaged items into tasks promptly
7. **Close the Loop**: Mark items as resolved when fixes are deployed

## Troubleshooting

### Items Not Appearing
- Check authentication tokens
- Verify webhook configuration
- Check browser console for errors
- Verify database connection

### Clustering Not Working
- Ensure you have multiple pending items
- Lower the similarity threshold
- Check item descriptions have sufficient text

### Duplicate Detection Too Aggressive
- Increase the duplicate threshold in the code
- Review and manually mark items as not duplicate

### Performance Issues
- Add database indexes (already included in migration)
- Archive old resolved items
- Limit query date ranges

## Integration Examples

### GitHub Actions
```yaml
- name: Report CI Failure to Triage
  if: failure()
  run: |
    curl -X POST ${{ secrets.TRIAGE_URL }}/api/triage/ingest \
      -H "Authorization: Bearer ${{ secrets.TRIAGE_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d "{
        \"source\": \"ci_failure\",
        \"data\": {
          \"jobId\": \"${{ github.run_id }}\",
          \"jobName\": \"${{ github.job }}\",
          \"branch\": \"${{ github.ref_name }}\",
          \"commit\": \"${{ github.sha }}\",
          \"errorMessage\": \"Build failed\",
          \"url\": \"${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}\"
        }
      }"
```

### Error Boundary (React)
```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  fetch('/api/triage/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'error_log',
      data: {
        message: error.message,
        stackTrace: error.stack,
        timestamp: new Date().toISOString(),
        context: errorInfo,
      }
    })
  });
}
```

## Future Enhancements

- AI-powered severity detection using LLMs
- Automatic root cause analysis
- Integration with more monitoring tools (Datadog, New Relic, etc.)
- Slack/Teams notifications
- Automated task creation workflows
- Machine learning for better agent matching
- Trend analysis and reporting
