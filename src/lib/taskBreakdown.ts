// Task Breakdown Service - Automated task breakdown using AI/LLM patterns

import { BreakdownRequest, BreakdownResponse, RiskLevel } from '@/types/breakdown';

/**
 * Break down an issue, PRD, or screenshot into epics, tickets, and subtasks
 * This uses rule-based logic and pattern matching to simulate AI breakdown
 * In production, this would integrate with an actual LLM API
 */
export async function breakdownTask(request: BreakdownRequest): Promise<BreakdownResponse> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const content = request.content.toLowerCase();
  const title = request.title.toLowerCase();

  // Extract keywords and patterns from content
  const keywords = extractKeywords(content + ' ' + title);
  const complexity = assessComplexity(content);
  const hasAuth = content.includes('auth') || content.includes('login') || content.includes('user');
  const hasAPI = content.includes('api') || content.includes('endpoint') || content.includes('backend');
  const hasUI = content.includes('ui') || content.includes('frontend') || content.includes('component');
  const hasDatabase = content.includes('database') || content.includes('db') || content.includes('schema');
  const hasTesting = content.includes('test') || content.includes('qa');

  const epics: BreakdownResponse['epics'] = [];
  const dependencies: BreakdownResponse['dependencies'] = [];

  // Generate epics based on detected features
  if (hasAuth) {
    const authEpic = generateAuthEpic(complexity);
    epics.push(authEpic);
  }

  if (hasAPI) {
    const apiEpic = generateAPIEpic(complexity);
    epics.push(apiEpic);
    if (hasAuth) {
      dependencies.push({
        from: 'API Development',
        to: 'Authentication System',
        type: 'depends-on'
      });
    }
  }

  if (hasUI) {
    const uiEpic = generateUIEpic(complexity, keywords);
    epics.push(uiEpic);
    if (hasAPI) {
      dependencies.push({
        from: 'UI Development',
        to: 'API Development',
        type: 'depends-on'
      });
    }
  }

  if (hasDatabase) {
    const dbEpic = generateDatabaseEpic(complexity);
    epics.push(dbEpic);
    if (hasAPI) {
      dependencies.push({
        from: 'API Development',
        to: 'Database Setup',
        type: 'depends-on'
      });
    }
  }

  // If no specific features detected, create a general epic
  if (epics.length === 0) {
    epics.push(generateGenericEpic(request.title, content, complexity));
  }

  // Add testing epic if project is complex
  if (complexity === 'high' || hasTesting) {
    epics.push(generateTestingEpic());
  }

  return { epics, dependencies };
}

function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  return text
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 10);
}

function assessComplexity(content: string): 'low' | 'medium' | 'high' {
  const length = content.length;
  const features = [
    'auth', 'payment', 'notification', 'real-time', 'websocket',
    'integration', 'migration', 'security', 'performance'
  ].filter(f => content.includes(f)).length;

  if (length > 1000 || features > 4) return 'high';
  if (length > 500 || features > 2) return 'medium';
  return 'low';
}

function generateAuthEpic(complexity: string): BreakdownResponse['epics'][0] {
  return {
    title: 'Authentication System',
    description: 'Implement user authentication and authorization',
    tickets: [
      {
        title: 'Setup Authentication Provider',
        description: 'Configure authentication service (e.g., Supabase Auth, Auth0, NextAuth)',
        priority: 5,
        estimatedHours: 4,
        tags: ['backend', 'auth', 'setup'],
        subtasks: [
          { title: 'Install authentication dependencies', description: 'Install required npm packages', estimatedHours: 0.5 },
          { title: 'Configure environment variables', description: 'Set up API keys and secrets', estimatedHours: 0.5 },
          { title: 'Initialize auth client', description: 'Create auth client instance', estimatedHours: 1 },
          { title: 'Setup auth middleware', description: 'Protect routes with auth middleware', estimatedHours: 2 }
        ],
        definitionOfDone: [
          'Authentication provider is configured',
          'Environment variables are set',
          'Auth client is initialized',
          'Documentation is updated'
        ],
        testNotes: [
          { description: 'Test successful authentication flow', testType: 'integration' },
          { description: 'Test error handling for invalid credentials', testType: 'integration' }
        ],
        risks: [
          { level: 'high', description: 'Security vulnerabilities in auth implementation', mitigation: 'Use well-tested auth library, follow security best practices' }
        ]
      },
      {
        title: 'Build Login Page',
        description: 'Create login UI with email/password fields',
        priority: 4,
        estimatedHours: 6,
        tags: ['frontend', 'ui', 'auth'],
        subtasks: [
          { title: 'Create login form component', description: 'Build form with validation', estimatedHours: 2 },
          { title: 'Implement form validation', description: 'Add client-side validation', estimatedHours: 1 },
          { title: 'Connect to auth API', description: 'Wire up form submission', estimatedHours: 2 },
          { title: 'Add error handling', description: 'Display error messages', estimatedHours: 1 }
        ],
        definitionOfDone: [
          'Login form is functional',
          'Form validation works',
          'Error messages are displayed',
          'Successful login redirects to dashboard'
        ],
        testNotes: [
          { description: 'Test form validation with invalid inputs', testType: 'e2e' },
          { description: 'Test successful login flow', testType: 'e2e' }
        ],
        risks: [
          { level: 'low', description: 'Poor UX with unclear error messages', mitigation: 'User test the login flow' }
        ]
      },
      {
        title: 'Implement Session Management',
        description: 'Handle user sessions and token refresh',
        priority: 4,
        estimatedHours: 5,
        tags: ['backend', 'auth'],
        subtasks: [
          { title: 'Setup session storage', description: 'Configure secure session storage', estimatedHours: 2 },
          { title: 'Implement token refresh', description: 'Auto-refresh expired tokens', estimatedHours: 2 },
          { title: 'Add logout functionality', description: 'Clear session on logout', estimatedHours: 1 }
        ],
        definitionOfDone: [
          'Sessions are stored securely',
          'Tokens refresh automatically',
          'Logout clears all session data'
        ],
        testNotes: [
          { description: 'Test token refresh on expiry', testType: 'integration' },
          { description: 'Test logout clears session', testType: 'integration' }
        ],
        risks: [
          { level: 'medium', description: 'Session token leakage', mitigation: 'Use httpOnly cookies, implement CSRF protection' }
        ]
      }
    ]
  };
}

function generateAPIEpic(complexity: string): BreakdownResponse['epics'][0] {
  return {
    title: 'API Development',
    description: 'Build backend API endpoints and business logic',
    tickets: [
      {
        title: 'Design API Schema',
        description: 'Define API endpoints, request/response schemas',
        priority: 5,
        estimatedHours: 4,
        tags: ['backend', 'api', 'design'],
        subtasks: [
          { title: 'Document API endpoints', description: 'List all required endpoints', estimatedHours: 2 },
          { title: 'Define data models', description: 'Create request/response schemas', estimatedHours: 2 }
        ],
        definitionOfDone: [
          'All endpoints are documented',
          'Request/response schemas are defined',
          'API design is reviewed'
        ],
        testNotes: [
          { description: 'Review API design with team', testType: 'manual' }
        ],
        risks: [
          { level: 'medium', description: 'API design changes after implementation', mitigation: 'Get stakeholder approval before coding' }
        ]
      },
      {
        title: 'Implement Core API Endpoints',
        description: 'Build CRUD operations for main resources',
        priority: 4,
        estimatedHours: 12,
        tags: ['backend', 'api'],
        subtasks: [
          { title: 'Create GET endpoints', description: 'Implement read operations', estimatedHours: 3 },
          { title: 'Create POST endpoints', description: 'Implement create operations', estimatedHours: 3 },
          { title: 'Create PUT/PATCH endpoints', description: 'Implement update operations', estimatedHours: 3 },
          { title: 'Create DELETE endpoints', description: 'Implement delete operations', estimatedHours: 3 }
        ],
        definitionOfDone: [
          'All CRUD endpoints are implemented',
          'Input validation is in place',
          'Error handling is consistent',
          'API returns proper status codes'
        ],
        testNotes: [
          { description: 'Test all CRUD operations', testType: 'integration' },
          { description: 'Test input validation', testType: 'unit' },
          { description: 'Test error responses', testType: 'integration' }
        ],
        risks: [
          { level: 'medium', description: 'Missing input validation leading to bad data', mitigation: 'Use schema validation library' }
        ]
      },
      {
        title: 'Add API Authentication',
        description: 'Secure API endpoints with authentication',
        priority: 5,
        estimatedHours: 6,
        tags: ['backend', 'api', 'security'],
        subtasks: [
          { title: 'Add auth middleware', description: 'Verify JWT tokens on requests', estimatedHours: 3 },
          { title: 'Implement authorization rules', description: 'Check user permissions', estimatedHours: 3 }
        ],
        definitionOfDone: [
          'All protected endpoints require authentication',
          'Unauthorized requests return 401',
          'Authorization rules are enforced'
        ],
        testNotes: [
          { description: 'Test accessing protected endpoint without token', testType: 'integration' },
          { description: 'Test authorization rules', testType: 'integration' }
        ],
        risks: [
          { level: 'high', description: 'Security vulnerability in auth middleware', mitigation: 'Code review, security audit' }
        ]
      }
    ]
  };
}

function generateUIEpic(complexity: string, keywords: string[]): BreakdownResponse['epics'][0] {
  return {
    title: 'UI Development',
    description: 'Build user interface components and pages',
    tickets: [
      {
        title: 'Design UI Mockups',
        description: 'Create wireframes and design system',
        priority: 4,
        estimatedHours: 8,
        tags: ['frontend', 'design', 'ui'],
        subtasks: [
          { title: 'Create wireframes', description: 'Design page layouts', estimatedHours: 4 },
          { title: 'Define design system', description: 'Set colors, typography, components', estimatedHours: 4 }
        ],
        definitionOfDone: [
          'Wireframes are approved',
          'Design system is documented',
          'Components are designed'
        ],
        testNotes: [
          { description: 'Review designs with stakeholders', testType: 'manual' }
        ],
        risks: [
          { level: 'low', description: 'Design changes during development', mitigation: 'Lock designs before implementation' }
        ]
      },
      {
        title: 'Build Core UI Components',
        description: 'Implement reusable UI components',
        priority: 4,
        estimatedHours: 16,
        tags: ['frontend', 'ui', 'components'],
        subtasks: [
          { title: 'Create button components', description: 'Build button variants', estimatedHours: 2 },
          { title: 'Create form components', description: 'Build inputs, selects, etc.', estimatedHours: 4 },
          { title: 'Create layout components', description: 'Build headers, sidebars, etc.', estimatedHours: 4 },
          { title: 'Create card components', description: 'Build content cards', estimatedHours: 3 },
          { title: 'Add dark mode support', description: 'Implement theme switching', estimatedHours: 3 }
        ],
        definitionOfDone: [
          'All core components are built',
          'Components are responsive',
          'Dark mode is supported',
          'Components are documented'
        ],
        testNotes: [
          { description: 'Test components in different screen sizes', testType: 'manual' },
          { description: 'Test dark mode toggle', testType: 'e2e' }
        ],
        risks: [
          { level: 'low', description: 'Inconsistent component API', mitigation: 'Document component props' }
        ]
      },
      {
        title: 'Build Main Pages',
        description: 'Implement primary application pages',
        priority: 3,
        estimatedHours: 20,
        tags: ['frontend', 'ui', 'pages'],
        subtasks: [
          { title: 'Build dashboard page', description: 'Main dashboard view', estimatedHours: 6 },
          { title: 'Build list/table views', description: 'Data display pages', estimatedHours: 6 },
          { title: 'Build detail pages', description: 'Individual item views', estimatedHours: 4 },
          { title: 'Build settings page', description: 'User settings', estimatedHours: 4 }
        ],
        definitionOfDone: [
          'All main pages are built',
          'Pages are responsive',
          'Navigation works correctly',
          'Loading states are implemented'
        ],
        testNotes: [
          { description: 'Test navigation between pages', testType: 'e2e' },
          { description: 'Test responsive layouts', testType: 'manual' }
        ],
        risks: [
          { level: 'medium', description: 'Poor performance with large datasets', mitigation: 'Implement pagination and virtualization' }
        ]
      }
    ]
  };
}

function generateDatabaseEpic(complexity: string): BreakdownResponse['epics'][0] {
  return {
    title: 'Database Setup',
    description: 'Design and implement database schema',
    tickets: [
      {
        title: 'Design Database Schema',
        description: 'Define tables, relationships, and indexes',
        priority: 5,
        estimatedHours: 6,
        tags: ['database', 'design'],
        subtasks: [
          { title: 'Identify entities and relationships', description: 'Create ER diagram', estimatedHours: 3 },
          { title: 'Define table schemas', description: 'Specify columns and types', estimatedHours: 2 },
          { title: 'Plan indexes and constraints', description: 'Optimize for queries', estimatedHours: 1 }
        ],
        definitionOfDone: [
          'ER diagram is complete',
          'All tables are defined',
          'Schema is reviewed',
          'Indexes are planned'
        ],
        testNotes: [
          { description: 'Review schema with team', testType: 'manual' }
        ],
        risks: [
          { level: 'high', description: 'Schema changes after data migration', mitigation: 'Thorough review before implementation' }
        ]
      },
      {
        title: 'Create Database Migrations',
        description: 'Write and test database migration scripts',
        priority: 5,
        estimatedHours: 4,
        tags: ['database', 'migration'],
        subtasks: [
          { title: 'Write create table migrations', description: 'Create all tables', estimatedHours: 2 },
          { title: 'Add indexes and constraints', description: 'Optimize schema', estimatedHours: 1 },
          { title: 'Test migrations', description: 'Ensure idempotency', estimatedHours: 1 }
        ],
        definitionOfDone: [
          'All migrations are written',
          'Migrations are tested',
          'Rollback scripts exist',
          'Migrations are idempotent'
        ],
        testNotes: [
          { description: 'Test migration up and down', testType: 'integration' },
          { description: 'Test on fresh database', testType: 'integration' }
        ],
        risks: [
          { level: 'critical', description: 'Data loss during migration', mitigation: 'Backup data, test thoroughly' }
        ]
      },
      {
        title: 'Implement Data Access Layer',
        description: 'Create database queries and ORM setup',
        priority: 4,
        estimatedHours: 8,
        tags: ['database', 'backend'],
        subtasks: [
          { title: 'Setup ORM/query builder', description: 'Configure database client', estimatedHours: 2 },
          { title: 'Create model definitions', description: 'Define data models', estimatedHours: 3 },
          { title: 'Write common queries', description: 'Implement CRUD operations', estimatedHours: 3 }
        ],
        definitionOfDone: [
          'ORM is configured',
          'All models are defined',
          'CRUD operations work',
          'Queries are optimized'
        ],
        testNotes: [
          { description: 'Test all database operations', testType: 'integration' },
          { description: 'Test query performance', testType: 'manual' }
        ],
        risks: [
          { level: 'medium', description: 'N+1 query problems', mitigation: 'Use eager loading, monitor query performance' }
        ]
      }
    ]
  };
}

function generateTestingEpic(): BreakdownResponse['epics'][0] {
  return {
    title: 'Testing & Quality Assurance',
    description: 'Comprehensive testing strategy',
    tickets: [
      {
        title: 'Setup Testing Framework',
        description: 'Configure testing tools and environment',
        priority: 4,
        estimatedHours: 4,
        tags: ['testing', 'setup'],
        subtasks: [
          { title: 'Install testing libraries', description: 'Jest, React Testing Library, Playwright', estimatedHours: 1 },
          { title: 'Configure test environment', description: 'Setup test database, env vars', estimatedHours: 2 },
          { title: 'Create test utilities', description: 'Helper functions, fixtures', estimatedHours: 1 }
        ],
        definitionOfDone: [
          'Testing framework is installed',
          'Test environment is configured',
          'CI/CD pipeline runs tests',
          'Test utilities are available'
        ],
        testNotes: [
          { description: 'Verify tests run in CI/CD', testType: 'integration' }
        ],
        risks: [
          { level: 'low', description: 'Flaky tests in CI', mitigation: 'Use proper test isolation' }
        ]
      },
      {
        title: 'Write Unit Tests',
        description: 'Test individual functions and components',
        priority: 3,
        estimatedHours: 16,
        tags: ['testing', 'unit'],
        subtasks: [
          { title: 'Test utility functions', description: 'Cover all utility functions', estimatedHours: 4 },
          { title: 'Test React components', description: 'Component unit tests', estimatedHours: 8 },
          { title: 'Test API handlers', description: 'Backend logic tests', estimatedHours: 4 }
        ],
        definitionOfDone: [
          'Code coverage is above 80%',
          'All critical paths are tested',
          'Tests are maintainable'
        ],
        testNotes: [
          { description: 'Run coverage report', testType: 'unit' }
        ],
        risks: [
          { level: 'low', description: 'Tests become maintenance burden', mitigation: 'Focus on critical paths' }
        ]
      },
      {
        title: 'Write E2E Tests',
        description: 'Test complete user flows',
        priority: 3,
        estimatedHours: 12,
        tags: ['testing', 'e2e'],
        subtasks: [
          { title: 'Test authentication flow', description: 'Login/logout/signup', estimatedHours: 4 },
          { title: 'Test main user journeys', description: 'Critical user paths', estimatedHours: 6 },
          { title: 'Test edge cases', description: 'Error scenarios', estimatedHours: 2 }
        ],
        definitionOfDone: [
          'All critical flows have E2E tests',
          'Tests run in CI/CD',
          'Tests are stable and reliable'
        ],
        testNotes: [
          { description: 'Run E2E tests against staging', testType: 'e2e' }
        ],
        risks: [
          { level: 'medium', description: 'E2E tests are slow and flaky', mitigation: 'Use proper waits, retry logic' }
        ]
      }
    ]
  };
}

function generateGenericEpic(title: string, content: string, complexity: string): BreakdownResponse['epics'][0] {
  const priority = complexity === 'high' ? 5 : complexity === 'medium' ? 4 : 3;
  const estimatedHours = complexity === 'high' ? 40 : complexity === 'medium' ? 20 : 10;

  return {
    title: title || 'Feature Implementation',
    description: content.substring(0, 200) || 'Implement the requested feature',
    tickets: [
      {
        title: 'Planning & Design',
        description: 'Plan implementation approach and design',
        priority: priority,
        estimatedHours: Math.ceil(estimatedHours * 0.2),
        tags: ['planning', 'design'],
        subtasks: [
          { title: 'Analyze requirements', description: 'Break down requirements', estimatedHours: 2 },
          { title: 'Design solution', description: 'Create technical design', estimatedHours: 3 },
          { title: 'Review with team', description: 'Get feedback', estimatedHours: 1 }
        ],
        definitionOfDone: [
          'Requirements are understood',
          'Solution is designed',
          'Design is approved'
        ],
        testNotes: [
          { description: 'Review design document', testType: 'manual' }
        ],
        risks: [
          { level: 'medium', description: 'Unclear requirements', mitigation: 'Clarify with stakeholders' }
        ]
      },
      {
        title: 'Core Implementation',
        description: 'Build the main functionality',
        priority: priority,
        estimatedHours: Math.ceil(estimatedHours * 0.6),
        tags: ['implementation'],
        subtasks: [
          { title: 'Setup project structure', description: 'Create necessary files', estimatedHours: 2 },
          { title: 'Implement core logic', description: 'Build main features', estimatedHours: Math.ceil(estimatedHours * 0.4) },
          { title: 'Add error handling', description: 'Handle edge cases', estimatedHours: 3 },
          { title: 'Write documentation', description: 'Document code and API', estimatedHours: 2 }
        ],
        definitionOfDone: [
          'Feature works as expected',
          'Error handling is in place',
          'Code is documented',
          'Code review is complete'
        ],
        testNotes: [
          { description: 'Test happy path', testType: 'integration' },
          { description: 'Test error scenarios', testType: 'integration' }
        ],
        risks: [
          { level: 'medium', description: 'Technical complexity', mitigation: 'Break into smaller pieces' }
        ]
      },
      {
        title: 'Testing & Polish',
        description: 'Test thoroughly and refine',
        priority: priority - 1,
        estimatedHours: Math.ceil(estimatedHours * 0.2),
        tags: ['testing', 'polish'],
        subtasks: [
          { title: 'Write tests', description: 'Unit and integration tests', estimatedHours: 4 },
          { title: 'Fix bugs', description: 'Address issues found', estimatedHours: 3 },
          { title: 'Performance optimization', description: 'Optimize if needed', estimatedHours: 2 }
        ],
        definitionOfDone: [
          'All tests pass',
          'No critical bugs',
          'Performance is acceptable'
        ],
        testNotes: [
          { description: 'Run full test suite', testType: 'unit' },
          { description: 'Manual testing', testType: 'manual' }
        ],
        risks: [
          { level: 'low', description: 'Bugs found late', mitigation: 'Test early and often' }
        ]
      }
    ]
  };
}

/**
 * Parse screenshot using OCR or image analysis
 * This is a placeholder - in production would use actual OCR/Vision API
 */
export async function parseScreenshot(imageUrl: string): Promise<string> {
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 500));

  return 'Parsed text from screenshot. In production, this would use OCR/Vision API to extract text and UI elements from the image.';
}
