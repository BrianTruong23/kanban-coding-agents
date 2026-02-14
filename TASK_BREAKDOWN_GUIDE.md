# Task Breakdown & Agent Orchestration Guide

This guide explains how to use the automated task breakdown and agent orchestration features in the Kanban for Coding Agents application.

## Overview

The Task Breakdown & Agent Orchestration system allows you to:

1. **Automatically break down** GitHub issues, PRD documents, or screenshots into manageable epics, tickets, and subtasks
2. **Generate comprehensive task details** including Definition of Done (DoD), test notes, and risk flags
3. **Visualize task dependencies** with an interactive dependency graph
4. **Manage agent skills** and track performance metrics
5. **Auto-assign tasks** to agents based on skills, availability, and performance history

## Accessing the Feature

From the main Kanban board, click the **"AI Breakdown"** button in the top-right corner to access the Task Breakdown & Agent Orchestration dashboard.

## Features

### 1. Task Breakdown Dashboard

#### Input Types

The system supports three types of input:

##### GitHub Issue
- Paste the content of a GitHub issue
- The system will parse it and identify tasks, priorities, and requirements
- Example format:
  ```
  Implement user authentication system

  - Add login page with email/password
  - Create registration flow
  - Implement password reset functionality
  - Add OAuth integration (Google, GitHub)
  ```

##### PRD Document
- Paste a Product Requirements Document
- The system will identify features, requirements, and user stories
- Works well with structured documents containing sections like:
  - Requirements
  - User Stories
  - Features
  - Technical Specifications

##### Screenshot
- Provide a description of what a screenshot shows
- Optionally include an image URL
- The system will create UI implementation tasks with appropriate DoD and test notes

#### Breakdown Process

1. **Select Input Type** - Choose from GitHub Issue, PRD, or Screenshot
2. **Paste Content** - Add your issue content or PRD text
3. **Click "Break Down Tasks"** - The system will analyze and generate tasks
4. **Review Generated Tasks** - See epics, tickets, and subtasks with full details
5. **Select Tasks** - Choose which tasks to add to your Kanban board
6. **Add to Board** - Click "Add to Kanban Board" to import selected tasks

#### Generated Task Details

Each generated task includes:

- **Task ID** - Unique identifier (EPIC-1, TICKET-1, SUB-1)
- **Type** - Epic, Ticket, or Subtask
- **Priority** - 1 (Low) to 5 (Critical)
- **Tags** - Auto-detected based on content (frontend, backend, bug, feature, etc.)
- **Estimated Hours** - Smart estimation based on complexity
- **Definition of Done (DoD)** - Checklist of completion criteria
- **Test Notes** - Unit, integration, e2e, and manual testing requirements
- **Risk Flags** - Identified risks with mitigation strategies
- **Auto-Assignment** - Suggested agent based on skills and availability

### 2. Dependency Graph Visualization

The dependency graph shows:

- **Visual representation** of task relationships
- **Color-coded connections**:
  - Red solid line: Blocks (blocking dependency)
  - Blue solid line: Child-of (hierarchical relationship)
  - Gray dashed line: Related (soft dependency)
- **Interactive nodes** - Click to view task details
- **Expandable view** - Full-screen mode for complex projects

### 3. Agent Roster Management

#### Performance Metrics

Track agent performance with these metrics:

- **Completed Tasks** - Total number of tasks completed
- **Quality Score** - Average quality rating (1-5 scale)
- **On-Time Rate** - Percentage of tasks completed on schedule
- **Current Workload** - Number of active assigned tasks

#### Skills Management

Each agent can have multiple skills with:

- **Category** - Frontend, Backend, Database, DevOps, Testing, Mobile, AI/ML, Security, Design, Documentation
- **Skill Name** - Specific technology or capability (e.g., React, Node.js, AWS)
- **Proficiency Level**:
  - 1 - Beginner
  - 2 - Intermediate
  - 3 - Proficient
  - 4 - Advanced
  - 5 - Expert

#### Adding Skills

1. Select an agent from the list
2. Click "Add Skill"
3. Choose category, enter skill name, and set proficiency level
4. Or use quick presets: "Add Frontend Skills", "Add Backend Skills", "Add Fullstack Skills"

#### Skill-Based Auto-Assignment

The auto-assignment algorithm considers:

- **Skill Match (40%)** - Agent's skills align with task tags
- **Performance (30%)** - Quality score and completion rate
- **Availability (20%)** - Current availability status
- **Workload (10%)** - Current number of assigned tasks

Higher priority tasks also receive a performance bonus to ensure they go to top performers.

### 4. Risk Flags

The system automatically identifies and flags potential risks:

#### Risk Levels
- **Low** - Minor concerns
- **Medium** - Moderate impact
- **High** - Significant impact requiring attention
- **Critical** - Major blocker or severe risk

#### Common Risk Categories
- **Database Changes** - Schema migrations, data integrity
- **Security Concerns** - Authentication, authorization, sensitive data
- **Time Pressure** - Urgent deadlines affecting quality
- **Performance Impact** - Optimization requirements, benchmarking needs

Each risk includes a suggested mitigation strategy.

### 5. Test Notes

Auto-generated test coverage recommendations:

- **Unit Tests** - Component and function-level tests
- **Integration Tests** - API, database, and service integration
- **E2E Tests** - End-to-end user flows
- **Manual Tests** - Human verification checklists

## Best Practices

### For Task Breakdown

1. **Be Descriptive** - Provide detailed issue descriptions for better parsing
2. **Use Structure** - Bullet points and numbered lists help the parser
3. **Include Context** - Mention technologies and requirements explicitly
4. **Review Before Adding** - Check generated tasks and adjust if needed

### For Agent Management

1. **Keep Skills Updated** - Regularly update agent proficiency levels
2. **Track Performance** - Log completed tasks with quality scores
3. **Balance Workload** - Monitor and distribute tasks evenly
4. **Develop Skills** - Use assignments to help agents grow capabilities

### For Auto-Assignment

1. **Set Realistic Skills** - Don't over-estimate proficiency levels
2. **Update Availability** - Mark agents as busy or unavailable when appropriate
3. **Review Suggestions** - Auto-assignment is a suggestion, not mandatory
4. **Consider Dependencies** - Assign related tasks to the same agent when beneficial

## Integration with Kanban Board

Tasks generated from the breakdown system seamlessly integrate with your main Kanban board:

- **Appear in Backlog** - All new tasks start in the TO DO column
- **Pre-Assigned** - Agents are already assigned based on skills
- **Full Task Details** - Access all DoD, tests, and risks from task cards
- **Normal Workflow** - Move through IN PROGRESS → IN REVIEW → DONE as usual

## Tips for Different Input Types

### GitHub Issues
- Copy the entire issue including title and description
- Include checkboxes and sub-tasks if present
- The system understands standard issue templates

### PRD Documents
- Include section headers (##) for better parsing
- Structure requirements clearly
- User stories are automatically identified

### Screenshots
- Describe the UI elements in detail
- Mention interaction patterns (buttons, forms, navigation)
- Include responsive requirements if needed

## Future Enhancements

Planned improvements:
- Integration with actual GitHub API for direct issue import
- Vision AI for screenshot analysis
- Machine learning for better complexity estimation
- Team velocity tracking and sprint planning
- Custom risk categories and mitigation templates
- Export to Jira, Linear, or other project management tools

## Troubleshooting

### Tasks Not Parsing Correctly
- Ensure content has clear structure (bullets, numbers)
- Add more descriptive text
- Try breaking very large issues into smaller pieces

### Auto-Assignment Not Working
- Verify agents have skills configured
- Check agent availability status
- Ensure tasks have relevant tags

### Performance Issues with Large Projects
- Break down into smaller batches
- Use the minimized dependency graph view
- Clear old breakdown tasks periodically

## Support

For questions or issues:
- Check the main README.md
- Review example inputs in the dashboard
- Experiment with different input formats
