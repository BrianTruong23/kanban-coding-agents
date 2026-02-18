import { ExtendedAgent, AgentSkill, SkillCategory } from '@/types/agentSkills';
import { generateId } from './utils';

/**
 * Mock data for demonstrating the agent orchestration system
 * This can be used for testing and development
 */

export const mockExtendedAgents: ExtendedAgent[] = [
  {
    id: generateId(),
    name: 'Alice Backend',
    description: 'Senior backend engineer specializing in Node.js and databases',
    avatar: 'AB',
    avatarColor: '#3b82f6',
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
    skills: [
      {
        id: generateId(),
        category: 'backend' as SkillCategory,
        name: 'Node.js',
        proficiency: 5,
        experienceYears: 8,
      },
      {
        id: generateId(),
        category: 'database' as SkillCategory,
        name: 'PostgreSQL',
        proficiency: 5,
        experienceYears: 7,
      },
      {
        id: generateId(),
        category: 'api-design' as SkillCategory,
        name: 'REST API',
        proficiency: 5,
        experienceYears: 8,
      },
      {
        id: generateId(),
        category: 'backend' as SkillCategory,
        name: 'TypeScript',
        proficiency: 4,
        experienceYears: 5,
      },
    ],
    performance: {
      agentId: '',
      tasksCompleted: 87,
      tasksInProgress: 2,
      averageCompletionTime: 6.5,
      successRate: 95,
      onTimeDeliveryRate: 92,
      qualityScore: 94,
      lastActive: Date.now(),
      totalHoursWorked: 520,
      specializations: ['backend', 'database', 'api-design'],
    },
    workload: {
      agentId: '',
      currentTasks: 2,
      estimatedHoursRemaining: 12,
      availability: 'available',
    },
    preferences: {
      preferredTaskTypes: ['ticket', 'subtask'],
      preferredComplexity: ['medium', 'high'],
      maxConcurrentTasks: 3,
    },
    status: 'active',
  },
  {
    id: generateId(),
    name: 'Bob Frontend',
    description: 'Frontend developer with expertise in React and modern UI frameworks',
    avatar: 'BF',
    avatarColor: '#10b981',
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000, // 6 months ago
    skills: [
      {
        id: generateId(),
        category: 'frontend' as SkillCategory,
        name: 'React',
        proficiency: 5,
        experienceYears: 6,
      },
      {
        id: generateId(),
        category: 'frontend' as SkillCategory,
        name: 'Next.js',
        proficiency: 4,
        experienceYears: 3,
      },
      {
        id: generateId(),
        category: 'ui-ux' as SkillCategory,
        name: 'Tailwind CSS',
        proficiency: 5,
        experienceYears: 4,
      },
      {
        id: generateId(),
        category: 'frontend' as SkillCategory,
        name: 'TypeScript',
        proficiency: 4,
        experienceYears: 4,
      },
    ],
    performance: {
      agentId: '',
      tasksCompleted: 54,
      tasksInProgress: 3,
      averageCompletionTime: 7.2,
      successRate: 89,
      onTimeDeliveryRate: 85,
      qualityScore: 88,
      lastActive: Date.now(),
      totalHoursWorked: 380,
      specializations: ['frontend', 'ui-ux'],
    },
    workload: {
      agentId: '',
      currentTasks: 3,
      estimatedHoursRemaining: 22,
      availability: 'busy',
    },
    preferences: {
      preferredTaskTypes: ['ticket', 'subtask'],
      preferredComplexity: ['low', 'medium'],
      maxConcurrentTasks: 4,
    },
    status: 'active',
  },
  {
    id: generateId(),
    name: 'Charlie DevOps',
    description: 'DevOps engineer focused on CI/CD and cloud infrastructure',
    avatar: 'CD',
    avatarColor: '#f59e0b',
    createdAt: Date.now() - 270 * 24 * 60 * 60 * 1000, // 9 months ago
    skills: [
      {
        id: generateId(),
        category: 'devops' as SkillCategory,
        name: 'Docker',
        proficiency: 5,
        experienceYears: 5,
      },
      {
        id: generateId(),
        category: 'devops' as SkillCategory,
        name: 'Kubernetes',
        proficiency: 4,
        experienceYears: 3,
      },
      {
        id: generateId(),
        category: 'devops' as SkillCategory,
        name: 'AWS',
        proficiency: 4,
        experienceYears: 4,
      },
      {
        id: generateId(),
        category: 'devops' as SkillCategory,
        name: 'CI/CD',
        proficiency: 5,
        experienceYears: 6,
      },
    ],
    performance: {
      agentId: '',
      tasksCompleted: 42,
      tasksInProgress: 1,
      averageCompletionTime: 5.8,
      successRate: 97,
      onTimeDeliveryRate: 96,
      qualityScore: 96,
      lastActive: Date.now(),
      totalHoursWorked: 245,
      specializations: ['devops'],
    },
    workload: {
      agentId: '',
      currentTasks: 1,
      estimatedHoursRemaining: 5,
      availability: 'available',
    },
    preferences: {
      preferredTaskTypes: ['ticket', 'subtask'],
      preferredComplexity: ['medium', 'high'],
      maxConcurrentTasks: 3,
    },
    status: 'active',
  },
  {
    id: generateId(),
    name: 'Diana QA',
    description: 'Quality assurance engineer with testing automation expertise',
    avatar: 'DQ',
    avatarColor: '#8b5cf6',
    createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000, // 5 months ago
    skills: [
      {
        id: generateId(),
        category: 'testing' as SkillCategory,
        name: 'Jest',
        proficiency: 5,
        experienceYears: 5,
      },
      {
        id: generateId(),
        category: 'testing' as SkillCategory,
        name: 'Cypress',
        proficiency: 4,
        experienceYears: 3,
      },
      {
        id: generateId(),
        category: 'testing' as SkillCategory,
        name: 'Playwright',
        proficiency: 4,
        experienceYears: 2,
      },
      {
        id: generateId(),
        category: 'testing' as SkillCategory,
        name: 'Test Automation',
        proficiency: 5,
        experienceYears: 6,
      },
    ],
    performance: {
      agentId: '',
      tasksCompleted: 38,
      tasksInProgress: 2,
      averageCompletionTime: 4.5,
      successRate: 93,
      onTimeDeliveryRate: 91,
      qualityScore: 92,
      lastActive: Date.now(),
      totalHoursWorked: 172,
      specializations: ['testing'],
    },
    workload: {
      agentId: '',
      currentTasks: 2,
      estimatedHoursRemaining: 8,
      availability: 'available',
    },
    preferences: {
      preferredTaskTypes: ['subtask'],
      preferredComplexity: ['low', 'medium'],
      maxConcurrentTasks: 5,
    },
    status: 'active',
  },
  {
    id: generateId(),
    name: 'Eve Security',
    description: 'Security specialist focused on application security and audits',
    avatar: 'ES',
    avatarColor: '#ef4444',
    createdAt: Date.now() - 400 * 24 * 60 * 60 * 1000, // ~13 months ago
    skills: [
      {
        id: generateId(),
        category: 'security' as SkillCategory,
        name: 'OWASP',
        proficiency: 5,
        experienceYears: 7,
      },
      {
        id: generateId(),
        category: 'security' as SkillCategory,
        name: 'Penetration Testing',
        proficiency: 4,
        experienceYears: 5,
      },
      {
        id: generateId(),
        category: 'backend' as SkillCategory,
        name: 'Authentication',
        proficiency: 5,
        experienceYears: 6,
      },
      {
        id: generateId(),
        category: 'security' as SkillCategory,
        name: 'Security Audits',
        proficiency: 5,
        experienceYears: 8,
      },
    ],
    performance: {
      agentId: '',
      tasksCompleted: 31,
      tasksInProgress: 1,
      averageCompletionTime: 8.2,
      successRate: 98,
      onTimeDeliveryRate: 94,
      qualityScore: 97,
      lastActive: Date.now(),
      totalHoursWorked: 254,
      specializations: ['security', 'backend'],
    },
    workload: {
      agentId: '',
      currentTasks: 1,
      estimatedHoursRemaining: 8,
      availability: 'available',
    },
    preferences: {
      preferredTaskTypes: ['ticket', 'epic'],
      preferredComplexity: ['high'],
      maxConcurrentTasks: 2,
    },
    status: 'active',
  },
  {
    id: generateId(),
    name: 'Frank Fullstack',
    description: 'Full-stack developer with broad technology experience',
    avatar: 'FF',
    avatarColor: '#06b6d4',
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 3 months ago
    skills: [
      {
        id: generateId(),
        category: 'frontend' as SkillCategory,
        name: 'React',
        proficiency: 4,
        experienceYears: 4,
      },
      {
        id: generateId(),
        category: 'backend' as SkillCategory,
        name: 'Node.js',
        proficiency: 4,
        experienceYears: 4,
      },
      {
        id: generateId(),
        category: 'database' as SkillCategory,
        name: 'MongoDB',
        proficiency: 3,
        experienceYears: 3,
      },
      {
        id: generateId(),
        category: 'api-design' as SkillCategory,
        name: 'GraphQL',
        proficiency: 3,
        experienceYears: 2,
      },
    ],
    performance: {
      agentId: '',
      tasksCompleted: 25,
      tasksInProgress: 4,
      averageCompletionTime: 9.1,
      successRate: 82,
      onTimeDeliveryRate: 78,
      qualityScore: 81,
      lastActive: Date.now(),
      totalHoursWorked: 228,
      specializations: ['frontend', 'backend'],
    },
    workload: {
      agentId: '',
      currentTasks: 4,
      estimatedHoursRemaining: 35,
      availability: 'overloaded',
    },
    preferences: {
      preferredTaskTypes: ['ticket', 'subtask'],
      preferredComplexity: ['low', 'medium'],
      maxConcurrentTasks: 4,
    },
    status: 'active',
  },
];

// Sample PRD for testing the breakdown service
export const samplePRD = `
# User Authentication System - Product Requirements Document

## Overview
Implement a comprehensive user authentication system for the application with support for email/password authentication, social login, and role-based access control.

## Features

### Must Have
- User registration with email verification
- Login with email and password
- Logout functionality
- Password reset flow
- JWT token-based authentication
- Protected routes and middleware
- Session management

### Should Have
- OAuth integration (Google, GitHub)
- Remember me functionality
- Two-factor authentication (2FA)
- Role-based access control (RBAC)
- User profile management
- Account deletion

### Nice to Have
- Social login (Twitter, LinkedIn)
- Passwordless authentication
- Biometric authentication support
- Activity log

## Technical Requirements

### Backend
- Use Supabase for authentication backend
- Implement rate limiting for auth endpoints
- Store user data securely with encryption
- Implement refresh token rotation
- Add comprehensive logging

### Frontend
- Create responsive login/signup forms
- Implement form validation
- Add loading states and error handling
- Create protected route wrapper
- Build user profile page

### Security
- Implement HTTPS only
- Add CSRF protection
- Implement secure password requirements
- Add account lockout after failed attempts
- Security headers (CSP, HSTS, etc.)

### Testing
- Unit tests for auth functions
- Integration tests for API endpoints
- E2E tests for auth flows
- Security testing and penetration testing

## Constraints
- Must comply with GDPR and privacy regulations
- Session timeout after 24 hours of inactivity
- Support for 10,000+ concurrent users
- 99.9% uptime SLA

## Success Metrics
- User registration conversion rate > 60%
- Login success rate > 95%
- Average login time < 2 seconds
- Zero security breaches

## Timeline
- Phase 1 (Week 1-2): Basic email/password authentication
- Phase 2 (Week 3): OAuth integration
- Phase 3 (Week 4): RBAC and advanced features
- Phase 4 (Week 5): Testing and security audit
`;

// Sample GitHub issue for testing
export const sampleGitHubIssue = `
Add dark mode support to the application

## Description
Users should be able to toggle between light and dark themes. The theme preference should persist across sessions.

## Requirements
- [ ] Add theme toggle button in the header
- [ ] Create dark mode color scheme
- [ ] Update all components to support dark mode
- [ ] Store theme preference in localStorage
- [ ] Respect system preference on first load
- [ ] Add smooth transitions between themes

## Technical Details
- Use Tailwind CSS dark mode utilities
- Create a ThemeContext for global theme state
- Ensure all colors have dark mode variants
- Test accessibility in both modes

## Acceptance Criteria
- Theme toggles smoothly without page reload
- Preference persists after browser restart
- All text is readable in both modes
- Images and icons adapt to theme
- Respects prefers-color-scheme media query
`;
