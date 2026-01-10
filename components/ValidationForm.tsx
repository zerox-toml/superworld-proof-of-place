'use client';

import { useState, FormEvent } from 'react';

interface ValidationFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
}

export default function ValidationForm({ onSubmit, loading }: ValidationFormProps) {
  const [locationType, setLocationType] = useState<'coordinates' | 'poi'>('poi');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('locationType', locationType);
    await onSubmit(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Post Text <span className="text-red-500">*</span>
        </label>
        <textarea
          id="text"
          name="text"
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="e.g., Amazing concert at Madison Square Garden! #MSG"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Image (Optional)
        </label>
        <input
          type="file"
          id="image"
          name="image"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
        {imagePreview && (
          <div className="mt-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full h-32 object-cover rounded-md"
            />
          </div>
        )}
      </div>

      {/* Location Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Location Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="poi"
              checked={locationType === 'poi'}
              onChange={(e) => setLocationType(e.target.value as 'poi')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">POI Name</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="coordinates"
              checked={locationType === 'coordinates'}
              onChange={(e) => setLocationType(e.target.value as 'coordinates')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Coordinates</span>
          </label>
        </div>
      </div>

      {/* POI Input */}
      {locationType === 'poi' && (
        <>
          <div>
            <label htmlFor="poiName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Venue/POI Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="poiName"
              name="poiName"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Madison Square Garden"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., New York"
            />
          </div>
        </>
      )}

      {/* Coordinates Input */}
      {locationType === 'coordinates' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Latitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="lat"
              name="lat"
              required
              step="any"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="40.7505"
            />
          </div>
          <div>
            <label htmlFor="lng" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Longitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="lng"
              name="lng"
              required
              step="any"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="-73.9934"
            />
          </div>
        </div>
      )}

      {/* Timestamp (Optional) */}
      <div>
        <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Timestamp (Optional)
        </label>
        <input
          type="datetime-local"
          id="timestamp"
          name="timestamp"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leave empty to use current time
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
      >
        {loading ? 'Validating...' : 'Validate Post'}
      </button>
    </form>
  );
}

