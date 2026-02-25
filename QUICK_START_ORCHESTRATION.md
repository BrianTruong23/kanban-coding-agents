# Quick Start: AI Task Orchestration

## Getting Started in 5 Minutes

### 1. Access the Orchestration Page

From the main Kanban board, click the **"AI Orchestration"** button (purple/blue gradient) in the top-right corner.

### 2. Create Your First AI Breakdown

1. Click **"AI Breakdown"** button
2. Choose your input type:
   - **GitHub Issue**: For bug reports or feature requests
   - **PRD**: For product requirement documents
   - **Screenshot**: For UI mockups (describe what you see)

3. Enter your content:
   ```
   Title: Implement User Dashboard

   Content:
   1. Create dashboard layout with sidebar navigation
   2. Add user profile section with avatar and settings
   3. Display activity feed with recent actions
   4. Add analytics widgets for key metrics
   5. Implement real-time notifications
   ```

4. Configure priority and sprint
5. Click **"Analyze & Breakdown"**
6. Review the generated tasks
7. Click **"Create Tasks"**

**Result**: You now have 1 epic, 5 tickets, and ~20 subtasks with DoD, test notes, and risk assessments!

### 3. Auto-Assign Tasks to Agents

Click **"Auto-Assign All"** to automatically assign all unassigned tasks based on:
- Agent skills and proficiency
- Current workload
- Performance metrics
- Task priority

### 4. Explore the Views

**Hierarchy Tab**:
- See your epic → tickets → subtasks in a tree view
- Expand/collapse to see details
- View DoD, test notes, and risk information

**Dependencies Tab**:
- Visualize task relationships
- Red lines = blocking dependencies
- Blue lines = sequential tasks
- Dashed lines = related tasks

**Agents Tab**:
- View agent performance metrics
- Add skills with proficiency levels
- See current workload

## Example Workflows

### Workflow 1: New Feature Development

1. **Breakdown**: Paste PRD → Create epic with tickets
2. **Assign**: Auto-assign based on skills
3. **Visualize**: Check dependencies in graph view
4. **Track**: Monitor progress in hierarchy view

### Workflow 2: Bug Fix Sprint

1. **Breakdown**: Paste multiple bug reports
2. **Prioritize**: Set high priority for critical bugs
3. **Assign**: Auto-assign to agents with relevant skills
4. **Monitor**: Track completion in hierarchy

### Workflow 3: Team Capacity Planning

1. **Agents Tab**: Review current workload
2. **Auto-Assign**: Distribute new work evenly
3. **Dependencies**: Identify blocking tasks
4. **Hierarchy**: See total scope of work

## Tips for Best Results

### Writing Effective Inputs

✅ **Good**:
```
1. Create user registration form
2. Add email verification
3. Implement password strength checker
```

❌ **Less Effective**:
```
Build the registration stuff
```

### Tag Detection

The AI automatically detects tags like:
- `frontend` - React, UI, CSS keywords
- `backend` - API, server, database keywords
- `security` - Auth, encryption keywords
- `testing` - Test, QA keywords

Include these keywords in your content for better categorization.

### Risk Assessment

The AI flags risks based on keywords:
- **Critical**: urgent, emergency, down, outage
- **High**: breaking, security, production, data loss
- **Medium**: refactor, change, database
- **Low**: everything else

Mention these explicitly if they apply.

## Next Steps

1. **Database Setup**: Run `database/schema.sql` in Supabase to enable all features
2. **Add Agent Skills**: Go to Agents tab and add skills for better auto-assignment
3. **Create Your First Epic**: Try the breakdown wizard with a real project
4. **Explore Dependencies**: Create related tasks and see the graph

## Need Help?

- Read the full documentation: `ORCHESTRATION_FEATURES.md`
- Check the main README: `README.md`
- Review the database schema: `database/schema.sql`

## Feature Highlights

🤖 **AI Breakdown**: Automatically parse and structure work
📊 **Smart Assignment**: Match tasks to agents by skills
🎯 **Risk Flags**: Identify potential issues early
📝 **DoD & Tests**: Get acceptance criteria automatically
🔗 **Dependencies**: Visualize task relationships
📈 **Performance**: Track agent metrics over time
🎨 **Hierarchy**: See the big picture and details

Happy orchestrating! 🚀
