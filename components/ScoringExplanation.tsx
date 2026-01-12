'use client';

import { useState } from 'react';

export default function ScoringExplanation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">
            How Scoring Works
          </h3>
        </div>
        <svg
          className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Scoring Model
            </h4>
            <p className="mb-2">
              Our validation system uses a <strong>weighted heuristic model</strong> that analyzes
              four key signals to determine if a post plausibly belongs at its claimed location:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Text-Place Consistency (40%)</strong> - Checks if the text mentions the
                location, venue name, or city
              </li>
              <li>
                <strong>Image Evidence (30%)</strong> - Validates GPS EXIF data and detects
                duplicate images
              </li>
              <li>
                <strong>Time Plausibility (20%)</strong> - Verifies if the timestamp makes sense
                for the venue type
              </li>
              <li>
                <strong>Spam Risk (10% penalty)</strong> - Detects gaming patterns like duplicate
                content or burst submissions
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Classification Thresholds
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span>
                  <strong>PASS (≥70%)</strong> - High confidence, location verified
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span>
                  <strong>LOW_CONFIDENCE (40-69%)</strong> - Moderate confidence, needs review
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>
                  <strong>FLAGGED (&lt;40%)</strong> - Low confidence, likely invalid or fake
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-3">
            <p className="text-xs">
              <strong>Note:</strong> This system provides probabilistic scoring (0-100%), not
              binary yes/no decisions. Each score includes detailed reasoning for transparency and
              validator auditing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

