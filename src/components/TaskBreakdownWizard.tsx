'use client';

import { useState } from 'react';
import { FileText, Image, Wand2, X, AlertCircle } from 'lucide-react';
import { analyzeAndBreakdown, analyzeScreenshot, BreakdownResult } from '@/services/aiTaskBreakdown';

interface TaskBreakdownWizardProps {
  onComplete: (result: BreakdownResult) => void;
  onCancel: () => void;
}

export const TaskBreakdownWizard = ({ onComplete, onCancel }: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [inputType, setInputType] = useState<'text' | 'screenshot'>('text');
  const [textInput, setTextInput] = useState('');
  const [imageInput, setImageInput] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
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
      setImageInput(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setError(null);
    setAnalyzing(true);

    try {
      let content = '';

      if (inputType === 'text') {
        if (!textInput.trim()) {
          setError('Please enter some text to analyze');
          setAnalyzing(false);
          return;
        }
        content = textInput;
      } else {
        if (!imageInput) {
          setError('Please upload a screenshot');
          setAnalyzing(false);
          return;
        }
        // First analyze screenshot to get text description
        content = await analyzeScreenshot(imageInput);
      }

      // Break down into tasks
      const breakdown = await analyzeAndBreakdown({
        type: inputType,
        content,
      });

      setResult(breakdown);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze input');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onComplete(result);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Wand2 size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Task Breakdown
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically break down issues, PRDs, or screenshots into actionable tasks
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setInputType('text')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'text'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FileText className="mx-auto mb-2" size={32} />
                    <div className="font-medium text-gray-900 dark:text-white">Text Input</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Paste issue description or PRD
                    </div>
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'screenshot'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Image className="mx-auto mb-2" size={32} />
                    <div className="font-medium text-gray-900 dark:text-white">Screenshot</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Upload mockup or design
                    </div>
                  </button>
                </div>
              </div>

              {/* Input Area */}
              {inputType === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Paste Your Issue, PRD, or Requirements
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Example:&#10;&#10;## User Authentication Feature&#10;&#10;We need to implement a complete user authentication system including:&#10;- User registration with email validation&#10;- Login with JWT tokens&#10;- Password reset functionality&#10;- Social login (Google, GitHub)&#10;&#10;Priority: High&#10;Estimated time: 2 weeks"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Screenshot or Mockup
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
                    {imageInput ? (
                      <div className="space-y-4">
                        <img
                          src={imageInput}
                          alt="Uploaded"
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <button
                          onClick={() => setImageInput(null)}
                          className="text-sm text-red-500 hover:text-red-600 mx-auto block"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center">
                        <Image size={48} className="text-gray-400 dark:text-gray-500 mb-3" />
                        <span className="text-gray-600 dark:text-gray-400 mb-1">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          PNG, JPG, or GIF up to 10MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Analyzing and breaking down tasks...</p>
            </div>
          )}

          {step === 'review' && result && (
            <div className="space-y-6">
              {/* Epic (if created) */}
              {result.epic && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                      EPIC
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white">{result.epic.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{result.epic.description}</p>
                  <div className="flex gap-2 mt-2">
                    {result.epic.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                  Generated Tasks ({result.tasks.length})
                </h3>
                <div className="space-y-3">
                  {result.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Priority: {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>

                      {/* Subtasks */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                            Subtasks ({task.subtasks.length})
                          </div>
                          <ul className="space-y-1">
                            {task.subtasks.map((subtask, sidx) => (
                              <li key={sidx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                <span className="text-gray-400">•</span>
                                {subtask.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* DoD */}
                      {task.definitionOfDone.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                            Definition of Done
                          </div>
                          <ul className="space-y-1">
                            {task.definitionOfDone.slice(0, 3).map((dod, didx) => (
                              <li key={didx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                {dod}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risk Flags */}
                      {task.riskFlags.length > 0 && (
                        <div className="flex gap-2">
                          {task.riskFlags.map((risk, ridx) => (
                            <span
                              key={ridx}
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                risk.level === 'critical'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : risk.level === 'high'
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                  : risk.level === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}
                              title={risk.description}
                            >
                              {risk.category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              {result.dependencies.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                    Dependencies ({result.dependencies.length})
                  </h3>
                  <div className="space-y-2">
                    {result.dependencies.map((dep, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                      >
                        <span className="font-medium">Task {dep.sourceTaskIndex + 1}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-purple-600 dark:text-purple-400">{dep.type}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium">Task {dep.targetTaskIndex + 1}</span>
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
          {step === 'input' && (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Analyze & Break Down
                  </>
                )}
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button
                onClick={() => {
                  setStep('input');
                  setResult(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Tasks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
