'use client';

import { useState } from 'react';
import { X, FileText, Image, GitBranch, Sparkles, AlertTriangle } from 'lucide-react';
import { BreakdownRequest } from '@/types/task';
import { breakdownTasks } from '@/lib/taskBreakdown';

interface TaskBreakdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (breakdown: ReturnType<typeof breakdownTasks>) => void;
  currentTaskCount: number;
}

export const TaskBreakdownDialog = ({
  isOpen,
  onClose,
  onBreakdownComplete,
  currentTaskCount
}: TaskBreakdownDialogProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewBreakdown, setPreviewBreakdown] = useState<ReturnType<typeof breakdownTasks> | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handlePreview = async () => {
    if (!content.trim() && !imageFile) return;

    setIsProcessing(true);
    try {
      const request: BreakdownRequest = {
        type: inputType,
        content: content,
        preferences: {
          includeTestCases: true,
          riskAssessment: true
        }
      };

      // If image, convert to base64
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = () => {
          request.imageData = reader.result as string;
        };
        reader.readAsDataURL(imageFile);
      }

      const breakdown = breakdownTasks(request, currentTaskCount + 1);
      setPreviewBreakdown(breakdown);
    } catch (error) {
      console.error('Failed to process breakdown:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (previewBreakdown) {
      onBreakdownComplete(previewBreakdown);
      handleClose();
    }
  };

  const handleClose = () => {
    setContent('');
    setImageFile(null);
    setPreviewBreakdown(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Automated Task Breakdown
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Break down issues, PRDs, or screenshots into structured tasks
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!previewBreakdown ? (
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setInputType('issue')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      inputType === 'issue'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <GitBranch className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">GitHub Issue</div>
                  </button>
                  <button
                    onClick={() => setInputType('prd')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      inputType === 'prd'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FileText className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">PRD Document</div>
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      inputType === 'screenshot'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Image className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">Screenshot</div>
                  </button>
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'screenshot' ? 'Upload Screenshot' : 'Paste Content'}
                </label>
                {inputType === 'screenshot' ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label htmlFor="screenshot-upload" className="cursor-pointer">
                      <Image className="mx-auto mb-2 text-gray-400" size={48} />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {imageFile ? imageFile.name : 'Click to upload or drag and drop'}
                      </p>
                    </label>
                  </div>
                ) : (
                  <textarea
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                    placeholder={
                      inputType === 'issue'
                        ? 'Paste your GitHub issue here...\n\nExample:\n# Feature: User Authentication\n- Implement login page\n- Add JWT token handling\n- Create user registration flow'
                        : 'Paste your PRD here...\n\nExample:\nPRD: E-commerce Checkout\n\nGoal: Implement a seamless checkout experience\n\nRequirements:\n1. Shopping cart review\n2. Payment integration\n3. Order confirmation'
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handlePreview}
                disabled={isProcessing || (!content.trim() && !imageFile)}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Task Breakdown
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview Header */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Breakdown Preview
                </h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Epic:</span>
                    <span className="ml-2 font-semibold">1</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Stories:</span>
                    <span className="ml-2 font-semibold">{previewBreakdown.stories.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tasks:</span>
                    <span className="ml-2 font-semibold">{previewBreakdown.tasks.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Subtasks:</span>
                    <span className="ml-2 font-semibold">{previewBreakdown.subtasks.length}</span>
                  </div>
                </div>
              </div>

              {/* Epic */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded" />
                  Epic
                </h4>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-gray-500">{previewBreakdown.epic.taskId}</span>
                    {previewBreakdown.epic.riskLevel && previewBreakdown.epic.riskLevel !== 'none' && (
                      <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                        <AlertTriangle size={12} />
                        {previewBreakdown.epic.riskLevel} risk
                      </span>
                    )}
                  </div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {previewBreakdown.epic.title}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {previewBreakdown.epic.description}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {previewBreakdown.epic.requiredSkills?.map(skill => (
                      <span key={skill} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stories and Tasks */}
              {previewBreakdown.stories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    Stories ({previewBreakdown.stories.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {previewBreakdown.stories.map(story => (
                      <div key={story.id} className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-sm">
                        <span className="font-mono text-xs text-gray-500 mr-2">{story.taskId}</span>
                        <span className="font-medium">{story.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {previewBreakdown.dependencies.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
                  <span className="font-semibold text-blue-900 dark:text-blue-300">
                    {previewBreakdown.dependencies.length} dependencies detected
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          {previewBreakdown && (
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
