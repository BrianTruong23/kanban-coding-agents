'use client';

import { useState } from 'react';
import { X, Wand2, FileText, Image, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { TaskInput } from '@/types/task';

interface TaskBreakdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdown: (input: TaskInput) => Promise<void>;
}

export const TaskBreakdownDialog = ({ isOpen, onClose, onBreakdown }: TaskBreakdownDialogProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let imageData: string | undefined;
      if (inputType === 'screenshot' && imageFile) {
        imageData = await fileToBase64(imageFile);
      }

      const input: TaskInput = {
        title,
        description,
        type: inputType,
        content: additionalContext,
        imageData
      };

      await onBreakdown(input);

      // Reset form
      setTitle('');
      setDescription('');
      setAdditionalContext('');
      setImageFile(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to break down task');
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI Task Breakdown
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically break down requirements into actionable tasks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Input Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setInputType('issue')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  inputType === 'issue'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <AlertCircle size={18} />
                <span className="text-sm font-medium">Issue</span>
              </button>
              <button
                type="button"
                onClick={() => setInputType('prd')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  inputType === 'prd'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <FileText size={18} />
                <span className="text-sm font-medium">PRD</span>
              </button>
              <button
                type="button"
                onClick={() => setInputType('screenshot')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  inputType === 'screenshot'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Image size={18} />
                <span className="text-sm font-medium">Screenshot</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement user authentication system"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isProcessing}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief overview of what needs to be done..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              disabled={isProcessing}
            />
          </div>

          {/* Screenshot Upload (conditional) */}
          {inputType === 'screenshot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Screenshot
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                {imageFile ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {imageFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(imageFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      disabled={isProcessing}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center">
                    <Image className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Additional Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Context
            </label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Add any additional requirements, constraints, or context..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              disabled={isProcessing}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  What happens next?
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>AI analyzes your input and creates an Epic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Breaks it down into Tickets with DoD and test notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Creates Subtasks with time estimates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Identifies dependencies and assigns risk levels</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Clock size={14} />
            Processing usually takes 5-10 seconds
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Break Down Task</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
