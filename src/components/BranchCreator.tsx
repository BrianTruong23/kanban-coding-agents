'use client';

import { useState } from 'react';
import { GitBranch, Check, AlertCircle } from 'lucide-react';
import { BRANCH_CONVENTIONS } from '@/types/pr-orchestration';
import { generateBranchName, validateBranchName } from '@/lib/git-operations';

interface BranchCreatorProps {
  onBranchCreate?: (branchName: string, type: string) => void;
}

export function BranchCreator({ onBranchCreate }: BranchCreatorProps) {
  const [branchType, setBranchType] = useState<keyof typeof BRANCH_CONVENTIONS>('feature');
  const [description, setDescription] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [customBranchName, setCustomBranchName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);

  const generatedName = useCustomName
    ? customBranchName
    : generateBranchName(branchType, description, issueNumber);

  const validation = validateBranchName(generatedName);

  const handleCreate = () => {
    if (validation.valid && generatedName) {
      onBranchCreate?.(generatedName, branchType);
      // Reset form
      setDescription('');
      setIssueNumber('');
      setCustomBranchName('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="text-blue-500" size={20} />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create New Branch
        </h3>
      </div>

      <div className="space-y-4">
        {/* Branch Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Branch Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.keys(BRANCH_CONVENTIONS).map((type) => (
              <button
                key={type}
                onClick={() => setBranchType(type as keyof typeof BRANCH_CONVENTIONS)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  branchType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Custom vs Generated */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="useCustomName"
            checked={useCustomName}
            onChange={(e) => setUseCustomName(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <label htmlFor="useCustomName" className="text-sm text-gray-700 dark:text-gray-300">
            Use custom branch name
          </label>
        </div>

        {useCustomName ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Branch Name
            </label>
            <input
              type="text"
              value={customBranchName}
              onChange={(e) => setCustomBranchName(e.target.value)}
              placeholder="my-custom-branch-name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ) : (
          <>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the branch"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Issue Number (conditional) */}
            {BRANCH_CONVENTIONS[branchType].includeIssueNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue Number (optional)
                </label>
                <input
                  type="text"
                  value={issueNumber}
                  onChange={(e) => setIssueNumber(e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </>
        )}

        {/* Preview */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Branch Name Preview
          </p>
          <code className="text-sm text-gray-900 dark:text-white font-mono">
            {generatedName || '(enter details above)'}
          </code>

          {/* Validation */}
          {generatedName && (
            <div className="mt-3">
              {validation.valid ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <Check size={16} />
                  <span>Valid branch name</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {validation.errors.map((error, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm"
                    >
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  ))}
                  {validation.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Suggestions:
                      </p>
                      {validation.suggestions.map((suggestion, idx) => (
                        <code
                          key={idx}
                          className="block text-sm text-blue-600 dark:text-blue-400 font-mono"
                        >
                          {suggestion}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Examples */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
            Examples for {branchType}:
          </p>
          <ul className="space-y-1">
            {BRANCH_CONVENTIONS[branchType].examples.map((example, idx) => (
              <li key={idx}>
                <code className="text-sm text-blue-700 dark:text-blue-400 font-mono">
                  {example}
                </code>
              </li>
            ))}
          </ul>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!validation.valid || !generatedName}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <GitBranch size={18} />
          Create Branch
        </button>
      </div>
    </div>
  );
}
