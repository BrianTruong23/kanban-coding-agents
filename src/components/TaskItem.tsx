import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { X, MessageCircle, Paperclip, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  agents: CodingAgent[];
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskItem = ({ task, agents, onUpdate, onDelete }: TaskItemProps) => {
  const assignedAgent = agents.find(a => a.id === task.assignedAgentId);

  const tagColors: { [key: string]: string } = {
    'frontend': 'bg-blue-100 text-blue-700 border-blue-200',
    'backend': 'bg-green-100 text-green-700 border-green-200',
    'bug': 'bg-red-100 text-red-700 border-red-200',
    'feature': 'bg-purple-100 text-purple-700 border-purple-200',
    'urgent': 'bg-orange-100 text-orange-700 border-orange-200',
    'api': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'ui': 'bg-pink-100 text-pink-700 border-pink-200',
  };

  const getTagColor = (tag: string): string => {
    const lowerTag = tag.toLowerCase();
    return tagColors[lowerTag] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 4) return <ArrowUp size={14} className="text-red-600" />;
    if (priority === 3) return <Minus size={14} className="text-yellow-600" />;
    return <ArrowDown size={14} className="text-gray-600" />;
  };

  const avatarColor = assignedAgent 
    ? (assignedAgent.avatarColor || getAvatarColor(assignedAgent.name))
    : 'bg-gray-400';

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 group relative hover:shadow-md transition-all cursor-pointer">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={14} />
      </button>
      
      <div className="pr-6">
        {/* Task ID */}
        <div className="text-xs text-gray-500 mb-1 font-mono">{task.taskId}</div>
        
        {/* Title */}
        <h4 className="font-semibold text-sm mb-2 text-gray-900 leading-tight">{task.title}</h4>
        
        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className={clsx(
                  "text-[10px] px-2 py-0.5 rounded font-semibold uppercase border",
                  getTagColor(tag)
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Footer with icons and assignee */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* Priority Icon */}
            <div className="flex items-center">
              {getPriorityIcon(task.priority)}
            </div>
            
            {/* Comments */}
            {task.commentsCount !== undefined && task.commentsCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500">
                <MessageCircle size={14} />
                <span className="text-xs">{task.commentsCount}</span>
              </div>
            )}
            
            {/* Attachments */}
            {task.attachmentsCount !== undefined && task.attachmentsCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500">
                <Paperclip size={14} />
                <span className="text-xs">{task.attachmentsCount}</span>
              </div>
            )}
          </div>
          
          {/* Assigned Agent Avatar */}
          {assignedAgent && (
            <div 
              className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold",
                avatarColor
              )}
              title={assignedAgent.name}
            >
              {assignedAgent.avatar || getInitials(assignedAgent.name)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
