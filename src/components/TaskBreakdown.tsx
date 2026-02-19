'use client';

import { useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { BreakdownInput, BreakdownResult } from '@/types/breakdown';
import { aiBreakdownService } from '@/services/aiBreakdown';

interface TaskBreakdownProps {
  onClose: () => void;
  onBreakdownComplete: (result: BreakdownResult) => void;
}

type InputType = 'prd' | 'github' | 'screenshot';

export const TaskBreakdown = ({ onClose, onBreakdownComplete }: TaskBreakdownProps) => {
  const [inputType, setInputType] = useState<InputType>('prd');
  const [prdText, setPrdText] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setScreenshot(base64);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleBreakdown = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let breakdownResult: BreakdownResult;

      if (inputType === 'prd') {
        if (!prdText.trim()) {
          setError('Please enter PRD text');
          setIsProcessing(false);
          return;
        }
        breakdownResult = await aiBreakdownService.breakdownFromPRD(prdText, context);
      } else if (inputType === 'github') {
        if (!githubUrl.trim()) {
          setError('Please enter GitHub issue URL');
          setIsProcessing(false);
          return;
        }
        breakdownResult = await aiBreakdownService.breakdownFromGitHubIssue(githubUrl, context);
      } else {
        if (!screenshot) {
          setError('Please upload a screenshot');
          setIsProcessing(false);
          return;
        }
        breakdownResult = await aiBreakdownService.breakdownFromScreenshot(screenshot, context);
      }

      setResult(breakdownResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process breakdown');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      onBreakdownComplete(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Automated Task Breakdown
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Transform issues, PRDs, or screenshots into structured epics, tickets, and subtasks
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setInputType('prd')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'prd'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <FileText size={24} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">PRD Text</span>
                  </button>
                  <button
                    onClick={() => setInputType('github')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'github'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Upload size={24} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">GitHub Issue</span>
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'screenshot'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <ImageIcon size={24} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Screenshot</span>
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              {inputType === 'prd' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PRD / Requirements Text
                  </label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none h-64"
                    placeholder="Paste your product requirements document or feature description here...&#10;&#10;Example:&#10;- Implement user authentication&#10;- Add dashboard with analytics&#10;- Create API endpoints for data access"
                    value={prdText}
                    onChange={(e) => setPrdText(e.target.value)}
                  />
                </div>
              )}

              {inputType === 'github' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GitHub Issue URL
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    placeholder="https://github.com/user/repo/issues/123"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>
              )}

              {inputType === 'screenshot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Screenshot
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    {!screenshot ? (
                      <div>
                        <ImageIcon size={48} className="mx-auto mb-4 text-gray-400" />
                        <label className="cursor-pointer">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Click to upload or drag and drop
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img src={screenshot} alt="Uploaded" className="max-h-64 mx-auto rounded" />
                        <button
                          onClick={() => setScreenshot(null)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Context Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none h-24"
                  placeholder="Any additional context, constraints, or requirements..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle size={24} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    Breakdown Complete
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    AI Confidence: {Math.round(result.aiConfidence * 100)}%
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                  {result.summary}
                </pre>
              </div>

              {/* Epic */}
              {result.epic && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Epic</h4>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-gray-900 dark:text-white">{result.epic.title}</h5>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                        {result.epic.epicId}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{result.epic.description}</p>
                    <div className="flex gap-2 mt-3">
                      {result.epic.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tickets */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Tickets ({result.tickets.length})
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {result.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</h5>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          {ticket.ticketId}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Priority: {ticket.priority}</span>
                        <span>•</span>
                        <span>{ticket.estimatedHours}h estimated</span>
                        <span>•</span>
                        <span>{ticket.riskFlags.length} risks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              {result.dependencies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Dependencies ({result.dependencies.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {result.dependencies.map((dep) => (
                      <div
                        key={dep.id}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                      >
                        <span className="font-mono text-xs">{dep.sourceTaskId}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-mono text-xs">{dep.targetTaskId}</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {dep.dependencyType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          {!result ? (
            <button
              onClick={handleBreakdown}
              disabled={isProcessing}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && <Loader2 size={16} className="animate-spin" />}
              {isProcessing ? 'Processing...' : 'Generate Breakdown'}
            </button>
          ) : (
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Accept & Create Tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
