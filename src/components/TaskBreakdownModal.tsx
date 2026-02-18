'use client';

import { useState } from 'react';
import { X, FileText, Upload, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Task } from '@/types/task';
import { analyzeAndBreakdown, BreakdownInput, BreakdownResult } from '@/lib/ai/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksGenerated: (result: BreakdownResult) => void;
}

export const TaskBreakdownModal = ({ isOpen, onClose, onTasksGenerated }: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'text' | 'screenshot'>('text');
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BreakdownResult | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      const input: BreakdownInput = {
        type: inputType === 'text' ? 'prd' : 'screenshot',
        content: textInput,
        imageData: imagePreview || undefined,
      };

      if (inputType === 'text' && !textInput.trim()) {
        throw new Error('Please enter a description');
      }

      if (inputType === 'screenshot' && !imageFile) {
        throw new Error('Please upload a screenshot');
      }

      const breakdown = await analyzeAndBreakdown(input);
      setResult(breakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onTasksGenerated(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setTextInput('');
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Task Breakdown</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Break down issues, PRDs, or screenshots into epics, stories, and tasks
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <div className="space-y-6">
              {/* Input Type Selector */}
              <div className="flex gap-3">
                <button
                  onClick={() => setInputType('text')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    inputType === 'text'
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FileText className="mx-auto mb-2" size={24} />
                  <div className="font-medium text-gray-900 dark:text-white">Text Input</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Paste issue description or PRD
                  </div>
                </button>
                <button
                  onClick={() => setInputType('screenshot')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    inputType === 'screenshot'
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Upload className="mx-auto mb-2" size={24} />
                  <div className="font-medium text-gray-900 dark:text-white">Screenshot</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Upload UI mockup or wireframe
                  </div>
                </button>
              </div>

              {/* Input Area */}
              {inputType === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Issue Description / PRD
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your issue description, product requirements, or feature request here...

Example:
# User Authentication Feature
We need to implement a complete user authentication system with email/password login, social auth (Google, GitHub), password reset, and email verification.

Requirements:
- Secure password hashing
- JWT token management
- Rate limiting for login attempts
- Remember me functionality
- Multi-factor authentication (optional)"
                    className="w-full h-64 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Screenshot
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg shadow-lg"
                        />
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                        <div className="text-gray-600 dark:text-gray-400 mb-2">
                          Click to upload or drag and drop
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="font-medium text-green-900 dark:text-green-100">Tasks Generated Successfully</div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Review the breakdown below and click &quot;Add to Board&quot; to import
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {result.epic ? 1 : 0}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">Epic</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {result.stories.length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">Stories</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {result.tasks.length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">Tasks</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {result.subtasks.length}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">Subtasks</div>
                </div>
              </div>

              {/* Epic Preview */}
              {result.epic && (
                <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50/50 dark:bg-purple-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-purple-600 text-white rounded">EPIC</span>
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{result.epic.taskId}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{result.epic.title}</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {result.epic.description.substring(0, 200)}...
                  </div>
                  {result.epic.riskFlags && result.epic.riskFlags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {result.epic.riskFlags.map(risk => (
                        <span
                          key={risk.id}
                          className={`text-xs px-2 py-1 rounded ${
                            risk.level === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            risk.level === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          <AlertTriangle size={12} className="inline mr-1" />
                          {risk.level}: {risk.description}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Task List Preview */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Generated Tasks Preview</h4>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {result.stories.map(story => (
                    <div key={story.id} className="text-sm p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{story.taskId}</span>
                      {' '}
                      <span className="font-medium text-gray-900 dark:text-white">{story.title}</span>
                    </div>
                  ))}
                  {result.tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded ml-4">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{task.taskId}</span>
                      {' '}
                      <span className="text-gray-700 dark:text-gray-300">{task.title}</span>
                    </div>
                  ))}
                  {result.tasks.length > 5 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                      + {result.tasks.length - 5} more tasks...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {!result ? (
            <button
              onClick={handleGenerate}
              disabled={isProcessing}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Generating...
                </>
              ) : (
                'Generate Tasks'
              )}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Add to Board
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
