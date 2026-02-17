'use client';

import { useState } from 'react';
import { FileText, Image, FileCode, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { BreakdownInput, TaskBreakdown } from '@/types/breakdown';
import { taskBreakdownService } from '@/services/taskBreakdownService';

interface TaskBreakdownWizardProps {
  userId: string;
  onComplete: (breakdown: TaskBreakdown) => void;
  onCancel: () => void;
}

export const TaskBreakdownWizard = ({ userId, onComplete, onCancel }: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<'select-type' | 'input-content' | 'processing' | 'review'>('select-type');
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [imageData, setImageData] = useState<string | undefined>();
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);

    try {
      const input: BreakdownInput = {
        type: inputType,
        content,
        context,
        imageData,
      };

      const result = await taskBreakdownService.breakdownInput(input, userId);
      setBreakdown(result);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process input');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (breakdown) {
      onComplete(breakdown);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Automated Task Breakdown
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Break down issues, PRDs, or screenshots into structured tasks
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Type */}
          {step === 'select-type' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                What would you like to break down?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setInputType('issue')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    inputType === 'issue'
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FileText className="mx-auto mb-3" size={32} />
                  <div className="font-semibold text-gray-900 dark:text-white">GitHub Issue</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Paste issue content
                  </div>
                </button>

                <button
                  onClick={() => setInputType('prd')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    inputType === 'prd'
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FileCode className="mx-auto mb-3" size={32} />
                  <div className="font-semibold text-gray-900 dark:text-white">PRD</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Product requirements document
                  </div>
                </button>

                <button
                  onClick={() => setInputType('screenshot')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    inputType === 'screenshot'
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Image className="mx-auto mb-3" size={32} />
                  <div className="font-semibold text-gray-900 dark:text-white">Screenshot</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Upload UI mockup
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Input Content */}
          {step === 'input-content' && (
            <div className="space-y-4">
              {inputType === 'screenshot' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-900 dark:text-white
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-black file:text-white
                        dark:file:bg-white dark:file:text-black
                        hover:file:bg-gray-800 dark:hover:file:bg-gray-200
                        cursor-pointer"
                    />
                    {imageData && (
                      <div className="mt-4">
                        <img src={imageData} alt="Preview" className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-700" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Context (optional)
                    </label>
                    <textarea
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      placeholder="Provide additional context about what should be built..."
                      className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {inputType === 'issue' ? 'Issue Content' : 'PRD Content'}
                  </label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={
                      inputType === 'issue'
                        ? 'Paste your GitHub issue content here...'
                        : 'Paste your PRD content here...'
                    }
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-96 resize-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 font-mono text-sm"
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing and breaking down into tasks...
              </p>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && breakdown && (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <div className="font-semibold text-green-900 dark:text-green-100">
                    Breakdown Complete
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Created {breakdown.tasks.length} task{breakdown.tasks.length !== 1 ? 's' : ''},{' '}
                    {breakdown.subtasks.length} subtask{breakdown.subtasks.length !== 1 ? 's' : ''}, and{' '}
                    {breakdown.dependencies.length} dependency link{breakdown.dependencies.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Tasks Preview */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Tasks ({breakdown.tasks.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {breakdown.tasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {task.taskId}: {task.title}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Priority: {task.priority} | Tags: {task.tags.join(', ') || 'None'}
                          </div>
                        </div>
                        {breakdown.riskFlags.get(task.id)?.some(r => r.level === 'high' || r.level === 'critical') && (
                          <AlertTriangle className="text-orange-500 flex-shrink-0 ml-2" size={16} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks Summary */}
              {Array.from(breakdown.riskFlags.values()).flat().length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Risk Flags
                  </h4>
                  <div className="space-y-2">
                    {Array.from(breakdown.riskFlags.entries()).map(([taskId, risks]) => {
                      const task = breakdown.tasks.find(t => t.id === taskId);
                      return risks.map(risk => (
                        <div
                          key={risk.id}
                          className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle
                              className={`flex-shrink-0 mt-0.5 ${
                                risk.level === 'critical' ? 'text-red-600' :
                                risk.level === 'high' ? 'text-orange-600' :
                                risk.level === 'medium' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`}
                              size={16}
                            />
                            <div className="flex-1 text-sm">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {task?.taskId}: {risk.description}
                              </div>
                              {risk.mitigation && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Mitigation: {risk.mitigation}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {step === 'select-type' && (
              <button
                onClick={() => setStep('input-content')}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
              >
                Next
              </button>
            )}

            {step === 'input-content' && (
              <>
                <button
                  onClick={() => setStep('select-type')}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    setStep('processing');
                    await handleProcess();
                  }}
                  disabled={processing || (inputType !== 'screenshot' && !content.trim()) || (inputType === 'screenshot' && !imageData)}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Process
                </button>
              </>
            )}

            {step === 'review' && (
              <>
                <button
                  onClick={() => {
                    setStep('input-content');
                    setBreakdown(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                >
                  Create Tasks
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
