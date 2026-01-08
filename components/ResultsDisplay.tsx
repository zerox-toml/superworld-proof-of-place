'use client';

import type { ValidationResponse } from '@/types';

interface ResultsDisplayProps {
  result: ValidationResponse;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'PASS':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'LOW_CONFIDENCE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'FLAGGED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 dark:text-green-400';
    if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Confidence Score</div>
        <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
          {formatPercentage(result.score)}
        </div>
        <div className={`mt-3 inline-block px-4 py-1 rounded-full border-2 font-semibold ${getClassificationColor(result.classification)}`}>
          {result.classification}
        </div>
      </div>

      {/* Signal Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Signal Breakdown
        </h3>
        <div className="space-y-3">
          {/* Text-Place Match */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Text-Place Consistency (40%)
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatPercentage(result.signals.text_place_match)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${result.signals.text_place_match * 100}%` }}
              />
            </div>
          </div>

          {/* Image Evidence */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Image Evidence (30%)
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatPercentage(result.signals.image_landmark)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${result.signals.image_landmark * 100}%` }}
              />
            </div>
          </div>

          {/* Time Plausibility */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Plausibility (20%)
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatPercentage(result.signals.time_plausibility)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${result.signals.time_plausibility * 100}%` }}
              />
            </div>
          </div>

          {/* Spam Risk */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Spam Risk (Penalty)
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatPercentage(result.signals.spam_risk)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${result.signals.spam_risk * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Explanation
        </h3>
        <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
          {result.explanation}
        </pre>
      </div>
    </div>
  );
}

