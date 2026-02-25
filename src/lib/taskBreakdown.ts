import { BreakdownInput, BreakdownResult, RiskLevel } from '@/types/breakdown';

/**
 * Task Breakdown Service
 *
 * This service analyzes issues, PRDs, or screenshots and breaks them down into
 * structured work items (epics, tickets, subtasks) with DoD, test notes, and risk flags.
 */

// Common skill categories
const COMMON_SKILLS = {
  frontend: ['React', 'Next.js', 'TypeScript', 'CSS', 'UI/UX', 'Tailwind'],
  backend: ['Node.js', 'API Design', 'Database Design', 'Authentication', 'Server-side Logic'],
  fullstack: ['React', 'Next.js', 'Node.js', 'API Design', 'Database Design'],
  testing: ['Unit Testing', 'Integration Testing', 'E2E Testing', 'Test Planning'],
  devops: ['CI/CD', 'Deployment', 'Infrastructure', 'Docker', 'Monitoring'],
  mobile: ['React Native', 'Mobile UI', 'iOS', 'Android'],
};

/**
 * Parse and break down a task from various input formats
 */
export async function breakdownTask(input: BreakdownInput): Promise<BreakdownResult> {
  const content = input.content.trim();

  // For now, we'll implement a rule-based breakdown
  // In a production system, this could be enhanced with AI/LLM integration

  if (input.type === 'screenshot') {
    return breakdownFromScreenshot(content, input.imageUrl);
  } else if (input.type === 'prd') {
    return breakdownFromPRD(content);
  } else if (input.type === 'issue') {
    return breakdownFromIssue(content);
  } else {
    return breakdownFromText(content);
  }
}

/**
 * Break down a GitHub issue or similar
 */
function breakdownFromIssue(content: string): BreakdownResult {
  const lines = content.split('\n').filter(l => l.trim());

  // Try to extract title (usually first line or header)
  const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^Issue:\s*(.+)$/im);
  const title = titleMatch ? titleMatch[1].trim() : lines[0] || 'New Feature';

  // Extract description
  const description = extractDescription(content, title);

  // Detect feature type and generate appropriate breakdown
  const featureType = detectFeatureType(content);

  return generateBreakdown(title, description, featureType, content);
}

/**
 * Break down a PRD (Product Requirements Document)
 */
function breakdownFromPRD(content: string): BreakdownResult {
  const sections = extractPRDSections(content);

  const title = sections.title || 'Product Feature Implementation';
  const description = sections.overview || sections.description || content.substring(0, 500);

  // PRDs typically contain more detailed requirements
  const tickets = generateTicketsFromRequirements(sections);

  return {
    epic: {
      title,
      description,
      priority: 4,
      tags: ['prd', 'feature'],
      estimatedHours: tickets.reduce((sum, t) => sum + t.estimatedHours, 0),
    },
    tickets,
  };
}

/**
 * Break down from a screenshot description
 */
function breakdownFromScreenshot(content: string, imageUrl?: string): BreakdownResult {
  // Screenshots usually describe UI changes
  const title = extractTitleFromText(content) || 'UI Implementation';

  return {
    epic: {
      title,
      description: content + (imageUrl ? `\n\nScreenshot: ${imageUrl}` : ''),
      priority: 3,
      tags: ['ui', 'frontend', 'screenshot'],
      estimatedHours: 20,
    },
    tickets: [
      {
        title: 'Design and Layout Implementation',
        description: 'Implement the UI components and layout as shown in the screenshot',
        priority: 4,
        tags: ['ui', 'frontend'],
        estimatedHours: 8,
        definitionOfDone: [
          'UI matches screenshot/design',
          'Responsive on mobile and desktop',
          'Passes accessibility checks',
        ],
        testNotes: [
          { description: 'Component renders correctly', type: 'unit' },
          { description: 'Visual regression test', type: 'e2e' },
        ],
        riskFlags: [],
        requiredSkills: ['React', 'CSS', 'UI/UX'],
        dependencies: [],
      },
      {
        title: 'Interactive Elements and State Management',
        description: 'Implement interactive functionality and state handling',
        priority: 4,
        tags: ['frontend', 'state'],
        estimatedHours: 6,
        definitionOfDone: [
          'All interactive elements work as expected',
          'State updates correctly',
          'No console errors',
        ],
        testNotes: [
          { description: 'User interactions tested', type: 'integration' },
          { description: 'State management verified', type: 'unit' },
        ],
        riskFlags: [],
        requiredSkills: ['React', 'TypeScript', 'State Management'],
        dependencies: [{ targetTicketIndex: 0, type: 'blocked-by' }],
      },
      {
        title: 'Integration and Testing',
        description: 'Integrate with backend and add comprehensive tests',
        priority: 3,
        tags: ['integration', 'testing'],
        estimatedHours: 6,
        definitionOfDone: [
          'Backend integration complete',
          'All tests passing',
          'Code reviewed',
        ],
        testNotes: [
          { description: 'API integration tests', type: 'integration' },
          { description: 'E2E user flow tests', type: 'e2e' },
        ],
        riskFlags: [],
        requiredSkills: ['Testing', 'API Design'],
        dependencies: [{ targetTicketIndex: 1, type: 'blocked-by' }],
      },
    ],
  };
}

/**
 * Break down from plain text
 */
function breakdownFromText(content: string): BreakdownResult {
  const title = extractTitleFromText(content) || 'New Task';
  const featureType = detectFeatureType(content);

  return generateBreakdown(title, content, featureType, content);
}

/**
 * Extract title from text content
 */
function extractTitleFromText(content: string): string | null {
  const lines = content.split('\n').filter(l => l.trim());
  if (!lines.length) return null;

  // Try markdown header
  const headerMatch = content.match(/^#{1,3}\s+(.+)$/m);
  if (headerMatch) return headerMatch[1].trim();

  // Try first line if it's short
  if (lines[0].length < 100) return lines[0].trim();

  return null;
}

/**
 * Extract description, excluding the title
 */
function extractDescription(content: string, title: string): string {
  let desc = content.replace(title, '').trim();
  desc = desc.replace(/^#{1,6}\s+/gm, '').trim();
  return desc || 'No description provided';
}

/**
 * Detect what type of feature is being requested
 */
function detectFeatureType(content: string): 'ui' | 'api' | 'fullstack' | 'testing' | 'devops' | 'refactor' {
  const lower = content.toLowerCase();

  if (lower.match(/\b(ui|component|design|layout|frontend|button|form|page)\b/)) return 'ui';
  if (lower.match(/\b(api|endpoint|route|backend|database|server)\b/)) return 'api';
  if (lower.match(/\b(test|testing|coverage|unit test|e2e)\b/)) return 'testing';
  if (lower.match(/\b(deploy|ci|cd|docker|infrastructure|devops)\b/)) return 'devops';
  if (lower.match(/\b(refactor|clean up|improve|optimize)\b/)) return 'refactor';

  return 'fullstack';
}

/**
 * Generate a structured breakdown based on feature type
 */
function generateBreakdown(
  title: string,
  description: string,
  featureType: 'ui' | 'api' | 'fullstack' | 'testing' | 'devops' | 'refactor',
  fullContent: string
): BreakdownResult {
  const priority = detectPriority(fullContent);
  const tags = detectTags(fullContent, featureType);

  switch (featureType) {
    case 'ui':
      return generateUIBreakdown(title, description, priority, tags);
    case 'api':
      return generateAPIBreakdown(title, description, priority, tags);
    case 'fullstack':
      return generateFullstackBreakdown(title, description, priority, tags);
    case 'testing':
      return generateTestingBreakdown(title, description, priority, tags);
    case 'devops':
      return generateDevOpsBreakdown(title, description, priority, tags);
    case 'refactor':
      return generateRefactorBreakdown(title, description, priority, tags);
  }
}

function generateUIBreakdown(title: string, description: string, priority: number, tags: string[]): BreakdownResult {
  return {
    epic: {
      title,
      description,
      priority: priority as 1 | 2 | 3 | 4 | 5,
      tags: [...tags, 'frontend', 'ui'],
      estimatedHours: 16,
    },
    tickets: [
      {
        title: 'UI Component Design and Structure',
        description: 'Create component structure and basic styling',
        priority: 4,
        tags: ['ui', 'react'],
        estimatedHours: 6,
        definitionOfDone: [
          'Component structure created',
          'Basic styling implemented',
          'Component is reusable',
        ],
        testNotes: [{ description: 'Component renders without errors', type: 'unit' }],
        riskFlags: [],
        requiredSkills: ['React', 'TypeScript', 'CSS'],
        dependencies: [],
      },
      {
        title: 'Interactive Features and State',
        description: 'Implement interactive functionality and state management',
        priority: 4,
        tags: ['frontend', 'state'],
        estimatedHours: 5,
        definitionOfDone: [
          'All interactions work correctly',
          'State updates properly',
          'No prop drilling issues',
        ],
        testNotes: [{ description: 'User interactions tested', type: 'integration' }],
        riskFlags: [],
        requiredSkills: ['React', 'State Management'],
        dependencies: [{ targetTicketIndex: 0, type: 'blocked-by' }],
      },
      {
        title: 'Styling and Responsiveness',
        description: 'Polish design and ensure responsive behavior',
        priority: 3,
        tags: ['ui', 'responsive'],
        estimatedHours: 5,
        definitionOfDone: [
          'Design matches mockups',
          'Responsive on all screen sizes',
          'Dark mode support (if applicable)',
        ],
        testNotes: [
          { description: 'Visual regression test', type: 'e2e' },
          { description: 'Responsive design verified', type: 'manual' },
        ],
        riskFlags: [],
        requiredSkills: ['CSS', 'UI/UX', 'Tailwind'],
        dependencies: [{ targetTicketIndex: 0, type: 'blocked-by' }],
      },
    ],
  };
}

function generateAPIBreakdown(title: string, description: string, priority: number, tags: string[]): BreakdownResult {
  return {
    epic: {
      title,
      description,
      priority: priority as 1 | 2 | 3 | 4 | 5,
      tags: [...tags, 'backend', 'api'],
      estimatedHours: 20,
    },
    tickets: [
      {
        title: 'Database Schema Design',
        description: 'Design and implement database schema',
        priority: 5,
        tags: ['database', 'schema'],
        estimatedHours: 4,
        definitionOfDone: [
          'Schema designed and documented',
          'Migration created',
          'Indexes added for performance',
        ],
        testNotes: [{ description: 'Migration runs successfully', type: 'integration' }],
        riskFlags: [
          {
            description: 'Schema changes may affect existing data',
            level: 'medium' as RiskLevel,
            mitigation: 'Create backup and test migration in staging',
          },
        ],
        requiredSkills: ['Database Design', 'SQL'],
        dependencies: [],
      },
      {
        title: 'API Endpoint Implementation',
        description: 'Implement API routes and business logic',
        priority: 5,
        tags: ['api', 'backend'],
        estimatedHours: 8,
        definitionOfDone: [
          'All CRUD endpoints implemented',
          'Validation added',
          'Error handling in place',
        ],
        testNotes: [
          { description: 'API endpoints tested', type: 'integration' },
          { description: 'Business logic unit tested', type: 'unit' },
        ],
        riskFlags: [],
        requiredSkills: ['Node.js', 'API Design', 'TypeScript'],
        dependencies: [{ targetTicketIndex: 0, type: 'blocked-by' }],
      },
      {
        title: 'Authentication and Authorization',
        description: 'Add auth checks and permissions',
        priority: 5,
        tags: ['auth', 'security'],
        estimatedHours: 5,
        definitionOfDone: [
          'Auth middleware implemented',
          'Permissions checked on all routes',
          'RLS policies updated',
        ],
        testNotes: [
          { description: 'Auth tests passing', type: 'integration' },
          { description: 'Security audit completed', type: 'manual' },
        ],
        riskFlags: [
          {
            description: 'Security vulnerabilities if not implemented correctly',
            level: 'high' as RiskLevel,
            mitigation: 'Code review by security-focused team member',
          },
        ],
        requiredSkills: ['Authentication', 'Security', 'API Design'],
        dependencies: [{ targetTicketIndex: 1, type: 'blocked-by' }],
      },
      {
        title: 'Documentation and Testing',
        description: 'Write API docs and comprehensive tests',
        priority: 3,
        tags: ['documentation', 'testing'],
        estimatedHours: 3,
        definitionOfDone: [
          'API documented (OpenAPI/Swagger)',
          'Test coverage >80%',
          'README updated',
        ],
        testNotes: [
          { description: 'All API tests passing', type: 'integration' },
          { description: 'Load testing completed', type: 'manual' },
        ],
        riskFlags: [],
        requiredSkills: ['Documentation', 'Testing', 'API Design'],
        dependencies: [{ targetTicketIndex: 2, type: 'blocked-by' }],
      },
    ],
  };
}

function generateFullstackBreakdown(title: string, description: string, priority: number, tags: string[]): BreakdownResult {
  return {
    epic: {
      title,
      description,
      priority: priority as 1 | 2 | 3 | 4 | 5,
      tags: [...tags, 'fullstack'],
      estimatedHours: 32,
    },
    tickets: [
      {
        title: 'Database and API Design',
        description: 'Design database schema and API endpoints',
        priority: 5,
        tags: ['backend', 'planning'],
        estimatedHours: 6,
        definitionOfDone: [
          'Schema designed',
          'API contract defined',
          'Technical design reviewed',
        ],
        testNotes: [{ description: 'Design review completed', type: 'manual' }],
        riskFlags: [],
        requiredSkills: ['Database Design', 'API Design'],
        dependencies: [],
      },
      {
        title: 'Backend Implementation',
        description: 'Implement database schema and API endpoints',
        priority: 5,
        tags: ['backend', 'api'],
        estimatedHours: 10,
        definitionOfDone: [
          'Database migration created',
          'API endpoints implemented',
          'Backend tests passing',
        ],
        testNotes: [
          { description: 'API integration tests', type: 'integration' },
          { description: 'Business logic unit tests', type: 'unit' },
        ],
        riskFlags: [],
        requiredSkills: ['Node.js', 'Database Design', 'API Design'],
        dependencies: [{ targetTicketIndex: 0, type: 'blocked-by' }],
      },
      {
        title: 'Frontend Components',
        description: 'Build UI components and pages',
        priority: 4,
        tags: ['frontend', 'ui'],
        estimatedHours: 8,
        definitionOfDone: [
          'Components implemented',
          'Styling complete',
          'Responsive design',
        ],
        testNotes: [{ description: 'Component tests', type: 'unit' }],
        riskFlags: [],
        requiredSkills: ['React', 'TypeScript', 'CSS'],
        dependencies: [],
      },
      {
        title: 'Frontend-Backend Integration',
        description: 'Connect frontend to backend APIs',
        priority: 4,
        tags: ['integration', 'fullstack'],
        estimatedHours: 5,
        definitionOfDone: [
          'API calls implemented',
          'Error handling in place',
          'Loading states handled',
        ],
        testNotes: [{ description: 'Integration tests', type: 'integration' }],
        riskFlags: [],
        requiredSkills: ['React', 'API Design', 'TypeScript'],
        dependencies: [
          { targetTicketIndex: 1, type: 'blocked-by' },
          { targetTicketIndex: 2, type: 'blocked-by' },
        ],
      },
      {
        title: 'Testing and Polish',
        description: 'Add comprehensive tests and polish UX',
        priority: 3,
        tags: ['testing', 'polish'],
        estimatedHours: 3,
        definitionOfDone: [
          'E2E tests passing',
          'UX polished',
          'Performance optimized',
        ],
        testNotes: [
          { description: 'E2E user flows', type: 'e2e' },
          { description: 'Performance testing', type: 'manual' },
        ],
        riskFlags: [],
        requiredSkills: ['Testing', 'Performance Optimization'],
        dependencies: [{ targetTicketIndex: 3, type: 'blocked-by' }],
      },
    ],
  };
}

function generateTestingBreakdown(title: string, description: string, priority: number, tags: string[]): BreakdownResult {
  return {
    epic: {
      title,
      description,
      priority: priority as 1 | 2 | 3 | 4 | 5,
      tags: [...tags, 'testing'],
      estimatedHours: 12,
    },
    tickets: [
      {
        title: 'Test Infrastructure Setup',
        description: 'Set up testing frameworks and tools',
        priority: 4,
        tags: ['testing', 'setup'],
        estimatedHours: 3,
        definitionOfDone: [
          'Testing frameworks installed',
          'Test configuration complete',
          'CI integration working',
        ],
        testNotes: [{ description: 'Sample tests running', type: 'unit' }],
        riskFlags: [],
        requiredSkills: ['Testing', 'CI/CD'],
        dependencies: [],
      },
      {
        title: 'Unit Tests',
        description: 'Write comprehensive unit tests',
        priority: 4,
        tags: ['testing', 'unit'],
        estimatedHours: 4,
        definitionOfDone: [
          'All functions unit tested',
          'Code coverage >80%',
          'Tests passing in CI',
        ],
        testNotes: [{ description: 'Unit test suite', type: 'unit' }],
        riskFlags: [],
        requiredSkills: ['Unit Testing', 'TypeScript'],
        dependencies: [{ targetTicketIndex: 0, type: 'blocked-by' }],
      },
      {
        title: 'Integration Tests',
        description: 'Add integration and E2E tests',
        priority: 3,
        tags: ['testing', 'integration'],
        estimatedHours: 5,
        definitionOfDone: [
          'Critical paths tested',
          'E2E tests automated',
          'Test documentation updated',
        ],
        testNotes: [
          { description: 'Integration test suite', type: 'integration' },
          { description: 'E2E test suite', type: 'e2e' },
        ],
        riskFlags: [],
        requiredSkills: ['Integration Testing', 'E2E Testing'],
        dependencies: [{ targetTicketIndex: 0, type: 'blocked-by' }],
      },
    ],
  };
}

function generateDevOpsBreakdown(title: string, description: string, priority: number, tags: string[]): BreakdownResult {
  return {
    epic: {
      title,
      description,
      priority: priority as 1 | 2 | 3 | 4 | 5,
      tags: [...tags, 'devops'],
      estimatedHours: 16,
    },
    tickets: [
      {
        title: 'Infrastructure Planning',
        description: 'Plan infrastructure and deployment strategy',
        priority: 5,
        tags: ['devops', 'planning'],
        estimatedHours: 3,
        definitionOfDone: [
          'Architecture documented',
          'Deployment strategy defined',
          'Cost estimate created',
        ],
        testNotes: [{ description: 'Architecture review', type: 'manual' }],
        riskFlags: [
          {
            description: 'Infrastructure costs may exceed budget',
            level: 'medium' as RiskLevel,
            mitigation: 'Review with finance team before implementation',
          },
        ],
        requiredSkills: ['Infrastructure', 'Cloud Architecture'],
        dependencies: [],
      },
      {
        title: 'CI/CD Pipeline',
        description: 'Set up automated build and deployment',
        priority: 5,
        tags: ['ci-cd', 'automation'],
        estimatedHours: 6,
        definitionOfDone: [
          'CI pipeline configured',
          'Automated tests running',
          'Deployment automation working',
        ],
        testNotes: [{ description: 'Pipeline test run', type: 'integration' }],
        riskFlags: [],
        requiredSkills: ['CI/CD', 'DevOps', 'Automation'],
        dependencies: [{ targetTicketIndex: 0, type: 'blocked-by' }],
      },
      {
        title: 'Monitoring and Logging',
        description: 'Set up monitoring, logging, and alerts',
        priority: 4,
        tags: ['monitoring', 'observability'],
        estimatedHours: 4,
        definitionOfDone: [
          'Monitoring dashboards created',
          'Alerts configured',
          'Log aggregation working',
        ],
        testNotes: [{ description: 'Alert testing', type: 'manual' }],
        riskFlags: [],
        requiredSkills: ['Monitoring', 'DevOps'],
        dependencies: [{ targetTicketIndex: 1, type: 'blocked-by' }],
      },
      {
        title: 'Documentation and Runbooks',
        description: 'Create operational documentation',
        priority: 3,
        tags: ['documentation'],
        estimatedHours: 3,
        definitionOfDone: [
          'Runbooks created',
          'Deployment docs written',
          'Troubleshooting guide complete',
        ],
        testNotes: [{ description: 'Documentation review', type: 'manual' }],
        riskFlags: [],
        requiredSkills: ['Documentation', 'DevOps'],
        dependencies: [{ targetTicketIndex: 2, type: 'blocked-by' }],
      },
    ],
  };
}

function generateRefactorBreakdown(title: string, description: string, priority: number, tags: string[]): BreakdownResult {
  return {
    epic: {
      title,
      description,
      priority: priority as 1 | 2 | 3 | 4 | 5,
      tags: [...tags, 'refactor'],
      estimatedHours: 12,
    },
    tickets: [
      {
        title: 'Code Analysis and Planning',
        description: 'Analyze current code and plan refactoring approach',
        priority: 4,
        tags: ['planning', 'analysis'],
        estimatedHours: 2,
        definitionOfDone: [
          'Code analyzed',
          'Refactoring plan created',
          'Risks identified',
        ],
        testNotes: [{ description: 'Plan review', type: 'manual' }],
        riskFlags: [
          {
            description: 'Refactoring may introduce bugs',
            level: 'medium' as RiskLevel,
            mitigation: 'Ensure test coverage before refactoring',
          },
        ],
        requiredSkills: ['Code Review', 'Architecture'],
        dependencies: [],
      },
      {
        title: 'Add Test Coverage',
        description: 'Add tests to ensure refactoring safety',
        priority: 5,
        tags: ['testing', 'safety'],
        estimatedHours: 4,
        definitionOfDone: [
          'Critical paths tested',
          'Test coverage >80%',
          'All tests passing',
        ],
        testNotes: [
          { description: 'Comprehensive test suite', type: 'unit' },
          { description: 'Integration tests', type: 'integration' },
        ],
        riskFlags: [],
        requiredSkills: ['Testing', 'TypeScript'],
        dependencies: [{ targetTicketIndex: 0, type: 'blocked-by' }],
      },
      {
        title: 'Perform Refactoring',
        description: 'Refactor code according to plan',
        priority: 4,
        tags: ['refactor', 'code-quality'],
        estimatedHours: 5,
        definitionOfDone: [
          'Code refactored',
          'All tests still passing',
          'Code reviewed',
        ],
        testNotes: [{ description: 'Regression testing', type: 'integration' }],
        riskFlags: [],
        requiredSkills: ['TypeScript', 'Code Quality', 'React'],
        dependencies: [{ targetTicketIndex: 1, type: 'blocked-by' }],
      },
      {
        title: 'Documentation Update',
        description: 'Update documentation to reflect changes',
        priority: 2,
        tags: ['documentation'],
        estimatedHours: 1,
        definitionOfDone: [
          'Code comments updated',
          'README updated',
          'Architecture docs updated',
        ],
        testNotes: [{ description: 'Documentation review', type: 'manual' }],
        riskFlags: [],
        requiredSkills: ['Documentation'],
        dependencies: [{ targetTicketIndex: 2, type: 'blocked-by' }],
      },
    ],
  };
}

/**
 * Detect priority from content (look for keywords)
 */
function detectPriority(content: string): number {
  const lower = content.toLowerCase();

  if (lower.match(/\b(critical|urgent|asap|p0|p1)\b/)) return 5;
  if (lower.match(/\b(important|high|p2)\b/)) return 4;
  if (lower.match(/\b(medium|normal|p3)\b/)) return 3;
  if (lower.match(/\b(low|minor|p4)\b/)) return 2;
  if (lower.match(/\b(trivial|nice to have|p5)\b/)) return 1;

  return 3; // default to medium
}

/**
 * Detect tags from content
 */
function detectTags(content: string, featureType: string): string[] {
  const tags: string[] = [featureType];
  const lower = content.toLowerCase();

  if (lower.match(/\b(bug|fix|broken)\b/)) tags.push('bug');
  if (lower.match(/\b(feature|new)\b/)) tags.push('feature');
  if (lower.match(/\b(ui|design|layout)\b/)) tags.push('ui');
  if (lower.match(/\b(api|backend)\b/)) tags.push('backend');
  if (lower.match(/\b(database|db)\b/)) tags.push('database');
  if (lower.match(/\b(auth|authentication)\b/)) tags.push('auth');
  if (lower.match(/\b(test|testing)\b/)) tags.push('testing');
  if (lower.match(/\b(performance|optimize)\b/)) tags.push('performance');
  if (lower.match(/\b(security)\b/)) tags.push('security');

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Extract sections from a PRD
 */
function extractPRDSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // Try to split by markdown headers
  const headerRegex = /^#{1,3}\s+(.+?)$/gm;
  const matches = [...content.matchAll(headerRegex)];

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const headerName = matches[i][1].toLowerCase().trim();
      const startPos = matches[i].index! + matches[i][0].length;
      const endPos = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      const sectionContent = content.substring(startPos, endPos).trim();

      sections[headerName] = sectionContent;
    }
  }

  return sections;
}

/**
 * Generate tickets from PRD requirements
 */
function generateTicketsFromRequirements(sections: Record<string, string>) {
  const tickets = [];

  // Look for common PRD sections
  const requirementSections = Object.entries(sections).filter(([key]) =>
    key.includes('requirement') || key.includes('feature') || key.includes('spec')
  );

  if (requirementSections.length === 0) {
    // Fallback to generic fullstack breakdown
    return generateFullstackBreakdown('PRD Implementation', Object.values(sections).join('\n'), 4, ['prd']).tickets;
  }

  // Parse requirements and create tickets
  for (const [sectionName, content] of requirementSections) {
    const items = content.split('\n').filter(l => l.trim().match(/^[-*]\s+/) || l.trim().match(/^\d+\.\s+/));

    for (const item of items) {
      const cleanItem = item.replace(/^[-*\d.]\s+/, '').trim();
      if (cleanItem.length < 10) continue; // Skip very short items

      const featureType = detectFeatureType(cleanItem);
      tickets.push({
        title: cleanItem.length > 80 ? cleanItem.substring(0, 77) + '...' : cleanItem,
        description: cleanItem,
        priority: detectPriority(cleanItem) as 1 | 2 | 3 | 4 | 5,
        tags: detectTags(cleanItem, featureType),
        estimatedHours: 8,
        definitionOfDone: [
          'Implementation complete',
          'Tests passing',
          'Code reviewed',
        ],
        testNotes: [
          { description: 'Feature tested', type: 'integration' as const },
        ],
        riskFlags: [],
        requiredSkills: featureType === 'ui' ? COMMON_SKILLS.frontend.slice(0, 3) :
                        featureType === 'api' ? COMMON_SKILLS.backend.slice(0, 3) :
                        COMMON_SKILLS.fullstack.slice(0, 3),
        dependencies: [],
      });
    }
  }

  return tickets.length > 0 ? tickets : generateFullstackBreakdown('PRD Implementation', Object.values(sections).join('\n'), 4, ['prd']).tickets;
}
