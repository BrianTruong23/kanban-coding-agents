'use client';

import { useState } from 'react';
import { TaskBreakdownInput, TaskBreakdownResult, TaskBreakdownItem } from '@/types/taskBreakdown';
import { breakdownTask } from '@/lib/taskBreakdownUtils';
import { DependencyGraph } from './DependencyGraph';
import { Upload, FileText, Image as ImageIcon, GitBranch, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface TaskBreakdownPanelProps {
  onClose?: () => void;
}

export const TaskBreakdownPanel = ({ onClose }: TaskBreakdownPanelProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot' | 'text'>('text');
  const [inputContent, setInputContent] = useState('');
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [context, setContext] = useState('');
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [selectedItem, setSelectedItem] = useState<TaskBreakdownItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBreakdown = () => {
    if (!inputContent.trim()) return;

    setIsProcessing(true);

    // Simulate processing delay for better UX
    setTimeout(() => {
      const input: TaskBreakdownInput = {
        type: inputType,
        content: inputContent,
        imageData,
        context,
      };

      const breakdownResult = breakdownTask(input);
      setResult(breakdownResult);
      setIsProcessing(false);
    }, 500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const allItems: TaskBreakdownItem[] = result
    ? [...result.epics, ...result.tickets, ...result.subtasks]
    : [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Automated Task Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Break down issues, PRDs, or requirements into epics, tickets, and subtasks
            </p>
          </div>
        </div>

        {!result && (
          <div className="space-y-4">
            {/* Input Type Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Input Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setInputType('text')}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                    inputType === 'text'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FileText size={16} className="inline mr-1" />
                  Text
                </button>
                <button
                  onClick={() => setInputType('issue')}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                    inputType === 'issue'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <GitBranch size={16} className="inline mr-1" />
                  Issue
                </button>
                <button
                  onClick={() => setInputType('prd')}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                    inputType === 'prd'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FileText size={16} className="inline mr-1" />
                  PRD
                </button>
                <button
                  onClick={() => setInputType('screenshot')}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                    inputType === 'screenshot'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <ImageIcon size={16} className="inline mr-1" />
                  Screenshot
                </button>
              </div>
            </div>

            {/* Main Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                {inputType === 'issue' ? 'Issue Description' : inputType === 'prd' ? 'PRD Content' : 'Requirements'}
              </label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
                rows={8}
                placeholder={
                  inputType === 'issue'
                    ? 'Paste your GitHub issue or bug report here...'
                    : inputType === 'prd'
                    ? 'Paste your product requirements document here...'
                    : 'Describe what you want to build...'
                }
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
              />
            </div>

            {/* Screenshot Upload */}
            {inputType === 'screenshot' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Screenshot
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label htmlFor="screenshot-upload" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    {imageData && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        ✓ Image uploaded
                      </p>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Additional Context */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Context (optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="e.g., Tech stack, deadlines, constraints..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleBreakdown}
              disabled={!inputContent.trim() || isProcessing}
              className="w-full px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Break Down Tasks'}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.epics.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Epics</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.tickets.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tickets</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.subtasks.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Subtasks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.summary.totalEstimatedEffort}h
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Est. Effort</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setInputContent('');
                  setContext('');
                  setImageData(undefined);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Start Over
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Recommended Sprints
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                  {result.summary.recommendedSprints}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                  Risk Assessment
                </p>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                  {result.summary.riskAssessment}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="flex-1 grid grid-cols-2 gap-4 p-6 overflow-hidden">
          {/* Dependency Graph */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Dependency Graph
            </h3>
            <div className="flex-1 min-h-0">
              <DependencyGraph
                items={allItems}
                dependencies={result.dependencies}
                onItemClick={setSelectedItem}
              />
            </div>
          </div>

          {/* Item Details */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {selectedItem ? 'Item Details' : 'All Items'}
            </h3>
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded uppercase">
                        {selectedItem.type}
                      </span>
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {selectedItem.taskId}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedItem.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Priority */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </p>
                    <div className="flex gap-1">
                      {Array.from({ length: selectedItem.priority }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            selectedItem.priority >= 4 ? 'bg-red-500' : 'bg-yellow-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Estimated Effort */}
                  {selectedItem.estimatedEffort && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estimated Effort
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {selectedItem.estimatedEffort} hours
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Definition of Done */}
                  {selectedItem.definitionOfDone.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Definition of Done
                      </p>
                      <div className="space-y-1">
                        {selectedItem.definitionOfDone.map((dod) => (
                          <div key={dod.id} className="flex items-start gap-2">
                            <CheckCircle2
                              size={14}
                              className={dod.completed ? 'text-green-500' : 'text-gray-400'}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {dod.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Flags */}
                  {selectedItem.riskFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Risk Flags
                      </p>
                      <div className="space-y-2">
                        {selectedItem.riskFlags.map((risk) => (
                          <div
                            key={risk.id}
                            className={`p-2 rounded border ${
                              risk.level === 'critical'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                : risk.level === 'high'
                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle size={14} className="text-red-600" />
                              <span className="text-xs font-semibold uppercase">
                                {risk.level} Risk
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {risk.description}
                            </p>
                            {risk.mitigation && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Mitigation: {risk.mitigation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Notes */}
                  {selectedItem.testNotes.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Test Notes
                      </p>
                      <div className="space-y-2">
                        {selectedItem.testNotes.map((test) => (
                          <div
                            key={test.id}
                            className="p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded uppercase">
                                {test.category}
                              </span>
                              {test.estimatedEffort && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ~{test.estimatedEffort}h
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {test.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedItem.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedItem.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {allItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="w-full text-left p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded uppercase">
                          {item.type}
                        </span>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {item.taskId}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
