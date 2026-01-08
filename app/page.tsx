'use client';

import { useState } from 'react';
import ValidationForm from '@/components/ValidationForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import type { ValidationResponse } from '@/types';

export default function Home() {
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidation = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Validation failed');
      }

      const data: ValidationResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            SuperWorld
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-1">
            Proof-of-Place Validation System
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Validate location-tagged social media posts with geo-consistency scoring
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Submit Post for Validation
            </h2>
            <ValidationForm onSubmit={handleValidation} loading={loading} />
          </div>

          {/* Results Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Validation Results
            </h2>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            {result && !loading && <ResultsDisplay result={result} />}
            {!result && !loading && !error && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Submit a post to see validation results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
