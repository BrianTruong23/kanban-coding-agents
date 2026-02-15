import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { breakdownTaskWithAI } from '@/lib/ai/taskBreakdown';
import { batchAssignAgents, getWorkloadMap } from '@/lib/ai/agentAssignment';
import { BreakdownRequestType } from '@/types/breakdown';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestType, inputText, inputUrl } = body as {
      requestType: BreakdownRequestType;
      inputText?: string;
      inputUrl?: string;
    };

    if (!requestType || (!inputText && !inputUrl)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const input = inputText || inputUrl || '';

    // Create breakdown request record
    const { data: breakdownRequest, error: requestError } = await supabase
      .from('task_breakdown_requests')
      .insert({
        user_id: user.id,
        request_type: requestType,
        input_text: inputText || null,
        input_url: inputUrl || null,
        status: 'processing',
        ai_model: process.env.ANTHROPIC_API_KEY ? 'claude-3-5-sonnet' : 'gpt-4',
      })
      .select()
      .single();

    if (requestError) {
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    try {
      // Call AI to break down the task
      const breakdown = await breakdownTaskWithAI(input, requestType);

      // Create epic
      const epicNumber = await getNextEpicNumber(supabase, user.id);
      const { data: epic, error: epicError } = await supabase
        .from('epics')
        .insert({
          user_id: user.id,
          epic_id: `EPIC-${epicNumber}`,
          title: breakdown.epic.title,
          description: breakdown.epic.description,
          priority: breakdown.epic.priority,
          status: 'planning',
        })
        .select()
        .single();

      if (epicError || !epic) {
        throw new Error('Failed to create epic');
      }

      // Fetch agents with skills
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('*, skills:agent_skills(*), performance:agent_performance(*)')
        .eq('user_id', user.id);

      if (agentsError) {
        console.error('Failed to fetch agents:', agentsError);
      }

      // Get existing tasks for workload calculation
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id, assigned_agent_id, status')
        .eq('user_id', user.id);

      const workloadMap = getWorkloadMap(existingTasks || []);

      // Create tasks
      const taskNumber = await getNextTaskNumber(supabase, user.id);
      const createdTasks: Array<{ id: string; index: number }> = [];

      for (let i = 0; i < breakdown.tasks.length; i++) {
        const taskData = breakdown.tasks[i];

        // Auto-assign agent if we have agents
        let assignedAgentId: string | undefined;
        if (agents && agents.length > 0) {
          const { assignBestAgent } = await import('@/lib/ai/agentAssignment');
          const candidate = assignBestAgent(
            agents.map((a) => ({
              ...a,
              skills: a.skills || [],
              performance: a.performance?.[0],
            })),
            {
              requiredSkills: taskData.requiredSkills,
              priority: taskData.priority,
              estimatedHours: taskData.estimatedHours,
            },
            workloadMap
          );

          if (candidate) {
            assignedAgentId = candidate.agent.id;
            // Update workload map
            workloadMap.set(assignedAgentId, (workloadMap.get(assignedAgentId) || 0) + 1);
          }
        }

        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            task_id: `TASK-${taskNumber + i}`,
            title: taskData.title,
            description: taskData.description,
            epic_id: epic.id,
            priority: taskData.priority,
            tags: taskData.tags,
            assigned_agent_id: assignedAgentId,
            status: 'backlog',
          })
          .select()
          .single();

        if (taskError || !task) {
          console.error('Failed to create task:', taskError);
          continue;
        }

        createdTasks.push({ id: task.id, index: i });

        // Create subtasks
        const subtaskNumber = await getNextSubtaskNumber(supabase, user.id);
        for (let j = 0; j < taskData.subtasks.length; j++) {
          const subtaskData = taskData.subtasks[j];

          await supabase.from('subtasks').insert({
            user_id: user.id,
            task_id: task.id,
            subtask_id: `${task.task_id}-SUB-${j + 1}`,
            title: subtaskData.title,
            description: subtaskData.description,
            definition_of_done: subtaskData.definitionOfDone,
            test_notes: subtaskData.testNotes,
            risk_level: subtaskData.riskLevel,
            estimated_hours: subtaskData.estimatedHours,
            status: 'pending',
          });
        }
      }

      // Create dependencies
      for (const dep of breakdown.dependencies) {
        const fromTask = createdTasks.find((t) => t.index === dep.dependsOnTaskIndex);
        const toTask = createdTasks.find((t) => t.index === dep.taskIndex);

        if (fromTask && toTask) {
          await supabase.from('task_dependencies').insert({
            user_id: user.id,
            task_id: toTask.id,
            depends_on_task_id: fromTask.id,
            dependency_type: dep.type,
          });
        }
      }

      // Update breakdown request as completed
      await supabase
        .from('task_breakdown_requests')
        .update({
          status: 'completed',
          result_epic_id: epic.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', breakdownRequest.id);

      return NextResponse.json({
        success: true,
        epicId: epic.id,
        tasksCreated: createdTasks.length,
      });
    } catch (error) {
      // Update breakdown request as failed
      await supabase
        .from('task_breakdown_requests')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processed_at: new Date().toISOString(),
        })
        .eq('id', breakdownRequest.id);

      throw error;
    }
  } catch (error) {
    console.error('Breakdown error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process breakdown' },
      { status: 500 }
    );
  }
}

async function getNextEpicNumber(supabase: any, userId: string): Promise<number> {
  const { data } = await supabase
    .from('epics')
    .select('epic_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return 1;

  const match = data[0].epic_id.match(/EPIC-(\d+)/);
  return match ? parseInt(match[1], 10) + 1 : 1;
}

async function getNextTaskNumber(supabase: any, userId: string): Promise<number> {
  const { data } = await supabase
    .from('tasks')
    .select('task_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return 1;

  const match = data[0].task_id.match(/TASK-(\d+)/);
  return match ? parseInt(match[1], 10) + 1 : 1;
}

async function getNextSubtaskNumber(supabase: any, userId: string): Promise<number> {
  const { data } = await supabase
    .from('subtasks')
    .select('subtask_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return 1;

  // Extract number from pattern like "TASK-1-SUB-5"
  const match = data[0].subtask_id.match(/SUB-(\d+)/);
  return match ? parseInt(match[1], 10) + 1 : 1;
}
