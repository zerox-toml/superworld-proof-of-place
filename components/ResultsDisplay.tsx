"use client";

import type { ValidationResponse } from "@/types";
import { VALIDATION_CONSTANTS } from "@/lib/constants";

interface ResultsDisplayProps {
  result: ValidationResponse;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "PASS":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-300 dark:border-green-700";
      case "LOW_CONFIDENCE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700";
      case "FLAGGED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-300 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= VALIDATION_CONSTANTS.PASS_THRESHOLD)
      return "text-green-600 dark:text-green-400";
    if (score >= VALIDATION_CONSTANTS.LOW_CONFIDENCE_THRESHOLD)
      return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getClassificationDescription = (classification: string) => {
    switch (classification) {
      case "PASS":
        return "High confidence - Location verified with strong evidence";
      case "LOW_CONFIDENCE":
        return "Moderate confidence - Review recommended";
      case "FLAGGED":
        return "Low confidence - Likely invalid or suspicious";
      default:
        return "";
    }
  };

  const getSignalDescription = (signalName: string, score: number) => {
    const descriptions: Record<
      string,
      { high: string; medium: string; low: string }
    > = {
      text_place_match: {
        high: "Strong location match - Text explicitly mentions the location or venue",
        medium: "Moderate location match - Some location indicators found",
        low: "Weak location match - No clear location mentions in text",
      },
      image_landmark: {
        high: "Strong image evidence - GPS data matches or image is location-verified",
        medium:
          "Moderate image evidence - Image provided but limited validation",
        low: "Weak image evidence - No image or no validation data available",
      },
      time_plausibility: {
        high: "Perfect timing - Timestamp aligns with typical venue hours",
        medium: "Acceptable timing - Timestamp is plausible for venue type",
        low: "Improbable timing - Timestamp is outside normal hours or invalid",
      },
      spam_risk: {
        high: "High spam risk - Multiple gaming patterns detected",
        medium: "Moderate spam risk - Some suspicious patterns found",
        low: "Low spam risk - No significant gaming patterns detected",
      },
    };

    const desc = descriptions[signalName];
    if (!desc) return "";

    if (score >= 0.7) return desc.high;
    if (score >= 0.4) return desc.medium;
    return desc.low;
  };

  // Calculate contribution to final score
  const calculateContribution = (signalScore: number, weight: number) => {
    return signalScore * weight;
  };

  const textContribution = calculateContribution(
    result.signals.text_place_match,
    0.4
  );
  const imageContribution = calculateContribution(
    result.signals.image_landmark,
    0.3
  );
  const timeContribution = calculateContribution(
    result.signals.time_plausibility,
    0.2
  );
  const baseScore = textContribution + imageContribution + timeContribution;
  const spamPenalty = result.signals.spam_risk * 0.1;
  const adjustedScore = baseScore * (1 - spamPenalty);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="text-center p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Geo-Consistency Confidence Score
        </div>
        <div
          className={`text-5xl font-bold mb-2 ${getScoreColor(result.score)}`}
        >
          {formatPercentage(result.score)}
        </div>
        <div
          className={`inline-block px-4 py-2 rounded-full border-2 font-semibold text-sm mb-2 ${getClassificationColor(
            result.classification
          )}`}
        >
          {result.classification}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {getClassificationDescription(result.classification)}
        </p>
      </div>

      {/* Detailed Signal Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Signal Analysis Report
        </h3>
        <div className="space-y-4">
          {/* Text-Place Match */}
          <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Text-Place Consistency
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                    Weight: 40%
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {getSignalDescription(
                    "text_place_match",
                    result.signals.text_place_match
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPercentage(result.signals.text_place_match)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Contributes: {formatPercentage(textContribution)}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${result.signals.text_place_match * 100}%` }}
              />
            </div>
          </div>

          {/* Image Evidence */}
          <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Image Evidence
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    Weight: 30%
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {getSignalDescription(
                    "image_landmark",
                    result.signals.image_landmark
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPercentage(result.signals.image_landmark)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Contributes: {formatPercentage(imageContribution)}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${result.signals.image_landmark * 100}%` }}
              />
            </div>
          </div>

          {/* Time Plausibility */}
          <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Time Plausibility
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                    Weight: 20%
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {getSignalDescription(
                    "time_plausibility",
                    result.signals.time_plausibility
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPercentage(result.signals.time_plausibility)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Contributes: {formatPercentage(timeContribution)}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${result.signals.time_plausibility * 100}%` }}
              />
            </div>
          </div>

          {/* Spam Risk */}
          <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Spam Risk (Penalty)
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                    Penalty: 10%
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {getSignalDescription("spam_risk", result.signals.spam_risk)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPercentage(result.signals.spam_risk)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Penalty: {formatPercentage(spamPenalty)}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div
                className="bg-red-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${result.signals.spam_risk * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Score Calculation Summary */}
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Score Calculation Summary
        </h4>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Base Score (Weighted):</span>
            <span className="font-semibold">{formatPercentage(baseScore)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span className="ml-4">
              Text (40%) × {formatPercentage(result.signals.text_place_match)}
            </span>
            <span>{formatPercentage(textContribution)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span className="ml-4">
              Image (30%) × {formatPercentage(result.signals.image_landmark)}
            </span>
            <span>{formatPercentage(imageContribution)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span className="ml-4">
              Time (20%) × {formatPercentage(result.signals.time_plausibility)}
            </span>
            <span>{formatPercentage(timeContribution)}</span>
          </div>
          <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
            <div className="flex justify-between text-red-700 dark:text-red-400">
              <span>
                Spam Penalty ({formatPercentage(result.signals.spam_risk)} ×
                10%):
              </span>
              <span className="font-semibold">
                -{formatPercentage(spamPenalty)}
              </span>
            </div>
            <div className="flex justify-between text-gray-900 dark:text-white font-semibold mt-2">
              <span>Final Score:</span>
              <span>{formatPercentage(result.score)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Explanation */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Validation Report
        </h4>
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {result.explanation}
        </div>
      </div>
    </div>
  );
}
