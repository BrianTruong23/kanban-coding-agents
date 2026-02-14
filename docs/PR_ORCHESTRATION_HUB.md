# PR & Branch Orchestration Hub

## Overview

The PR & Branch Orchestration Hub is a centralized interface for managing Git branches, pull requests, and overall code review workflow. It provides one-click operations for common Git and GitHub tasks while maintaining best practices and conventions.

## Features

### 1. Branch Creation with Naming Conventions

Create branches that follow standardized naming patterns:

- **Feature branches**: `feature/issue-{number}` or `feature/{description}`
- **Bugfix branches**: `bugfix/issue-{number}` or `bugfix/{description}`
- **Hotfix branches**: `hotfix/{description}`
- **Release branches**: `release/v{version}`
- **Chore branches**: `chore/{description}`

**Key Benefits:**
- Automatic validation against naming conventions
- Real-time preview of generated branch names
- Suggestions for invalid names
- Support for both issue-based and description-based naming

### 2. Pull Request Management

Centralized PR operations:

- **Create PRs**: One-click PR creation with auto-generated titles and descriptions
- **Auto-fill metadata**: Automatically generate PR titles and descriptions from branch names and commits
- **View PR status**: See all open PRs with their current state
- **Check status**: Monitor CI/CD checks, reviews, and approvals
- **Merge PRs**: Merge when all checks pass and reviews are approved

**Features:**
- Visual indicators for PR state (open, merged, closed)
- Check status tracking (success, failure, pending)
- Review and approval counts
- File change statistics
- Conflict detection

### 3. Rebase Support

Keep branches up-to-date with target branches:

- One-click rebase onto main/master
- Conflict detection and reporting
- Rebase status monitoring

### 4. PR Health Panel

Comprehensive health monitoring for pull requests:

#### Overall Health Score (0-100)
- Calculated based on checks, tests, conflicts, and file complexity
- Color-coded indicators (green: 80+, yellow: 60-79, red: <60)

#### Failing Checks
- Lists all CI/CD checks that are failing
- Shows check descriptions and status
- Links to detailed check logs

#### Flaky Tests
- Identifies tests that fail intermittently
- Helps prioritize test reliability improvements
- Shows file paths for easy navigation

#### Conflict Risks
- **Risk Levels**: High, Medium, Low
- **Details**:
  - Files with potential conflicts
  - Reason for conflict risk
  - Affected branches
- Helps prevent merge conflicts before they occur

#### File Hotspots
- **Change Frequency**: Number of times file has been modified
- **Authors**: List of contributors to the file
- **Lines Changed**: Total lines modified
- **Complexity**: Low, Medium, High
- Identifies files that may need refactoring or have high churn

### 5. Quick Actions

Convenient shortcuts for common operations:

- **Fetch Latest Changes**: Pull latest from remote
- **Clean Up Stale Branches**: Remove old merged branches
- **Sync All Branches**: Update all local branches with remote

## Architecture

### Components

#### `BranchCreator.tsx`
- Branch name generation UI
- Validation and suggestions
- Convention examples

#### `PRManager.tsx`
- PR list and details
- Create PR form
- Merge and rebase actions
- Mergeability checks

#### `PRHealthPanel.tsx`
- Health score visualization
- Failing checks display
- Flaky test detection
- Conflict risk analysis
- File hotspot metrics

### Types (`src/types/pr-orchestration.ts`)

```typescript
interface BranchInfo
interface PullRequest
interface CheckStatus
interface PRHealth
interface ConflictRisk
interface FileHotspot
interface Mergeability
interface RebaseStatus
```

### Utilities (`src/lib/git-operations.ts`)

- `generateBranchName()`: Create branch names following conventions
- `validateBranchName()`: Validate against conventions
- `getBranches()`: Fetch branch information
- `getPullRequests()`: Fetch PR data
- `analyzePRHealth()`: Calculate PR health metrics
- `checkMergeability()`: Determine if PR can be merged
- `generatePRMetadata()`: Auto-generate PR titles and descriptions

### Hook (`src/hooks/usePROrchestration.ts`)

Custom React hook for state management:

```typescript
const {
  branches,
  pullRequests,
  loading,
  error,
  loadBranches,
  loadPullRequests,
  createBranch,
  createPullRequest,
  mergePullRequest,
  rebaseBranch,
  getPRHealthAnalysis,
  checkPRMergeability,
  getRebaseInfo,
} = usePROrchestration();
```

## Usage

### Accessing the Hub

1. From the Kanban Board, click the **"PR Hub"** button in the header
2. Or navigate directly to `/pr-hub`

### Creating a Branch

1. Select branch type (feature, bugfix, etc.)
2. Enter description or issue number
3. Preview the generated name
4. Click "Create Branch"

### Creating a Pull Request

1. Click "Create PR" in the PR Manager
2. Enter branch name
3. Click "Auto-fill" to generate title and description
4. Customize as needed
5. Click "Create Pull Request"

### Monitoring PR Health

1. Select a PR from the PR Manager
2. View health score and detailed metrics
3. Address failing checks and conflict risks
4. Click "Refresh Health Check" to update

### Merging a PR

1. Select a PR from the list
2. Review mergeability status
3. Address any blockers
4. Click "Merge PR" when ready

## Integration Notes

### Git Operations

**Important**: This UI does NOT execute git commands directly. All git operations (branch creation, rebase, etc.) are handled by the orchestrator/backend system. The UI provides:

- User-friendly interface
- Validation and preview
- Status monitoring
- Operation requests to the backend

### GitHub API

Similar to git operations, GitHub API calls (creating PRs, merging, etc.) are handled by the backend. The UI:

- Displays PR data
- Shows check status
- Requests operations
- Monitors results

### Mock Data

The current implementation includes mock data for demonstration. In production:

1. Replace mock functions in `git-operations.ts` with actual API calls
2. Connect to backend endpoints for git operations
3. Integrate with GitHub API for PR management
4. Add real-time webhook support for status updates

## Best Practices

### Branch Naming

- Use conventional prefixes (feature/, bugfix/, etc.)
- Include issue numbers when applicable
- Keep descriptions concise and lowercase
- Use hyphens instead of underscores or spaces

### Pull Requests

- Keep PRs focused and small
- Address failing checks before requesting review
- Monitor PR health score
- Rebase regularly to avoid conflicts
- Ensure approvals before merging

### Health Monitoring

- Check PR health before requesting review
- Address flaky tests promptly
- Monitor file hotspots for refactoring opportunities
- Resolve conflict risks early

## Future Enhancements

### Potential Features

1. **Auto-merge on approval**: Automatically merge when conditions are met
2. **PR templates**: Customizable PR description templates
3. **Review assignment**: Intelligent reviewer selection
4. **Merge queues**: Orderly merging with conflict prevention
5. **Branch protection rules**: Enforce workflow policies
6. **Deployment tracking**: Link PRs to deployments
7. **Metrics dashboard**: Team-level PR analytics
8. **Notifications**: Real-time updates on PR status
9. **Draft PR support**: Create draft PRs for early feedback
10. **Squash and merge options**: Different merge strategies

### Integration Opportunities

- Slack/Teams notifications
- Jira/Linear issue linking
- CI/CD platform integration
- Code quality tools (SonarQube, CodeClimate)
- Deployment automation

## Troubleshooting

### Common Issues

**Branch name validation fails**
- Ensure lowercase letters only
- Use hyphens instead of spaces
- Follow conventional prefixes

**PR health score is low**
- Check failing CI/CD checks
- Review conflict risks
- Address flaky tests
- Consider refactoring hotspot files

**Cannot merge PR**
- Ensure all checks pass
- Get required approvals
- Resolve merge conflicts
- Rebase on target branch

## Support

For issues or feature requests:
1. Check this documentation
2. Review error messages in the UI
3. Consult the backend logs
4. Create an issue in the repository

## License

This feature is part of the Kanban for Coding Agents project.
