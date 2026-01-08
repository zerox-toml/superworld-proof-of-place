// Input types for validation request
export interface ValidationRequest {
  text: string;
  image?: File | string; // File object or base64 string
  location: LocationInput;
  timestamp?: string; // ISO 8601 format
}

export type LocationInput = 
  | { type: 'coordinates'; lat: number; lng: number }
  | { type: 'poi'; name: string; city: string };

// Output types for validation response
export interface ValidationResponse {
  score: number; // 0.0 - 1.0
  classification: Classification;
  signals: SignalBreakdown;
  explanation: string;
}

export type Classification = 'PASS' | 'LOW_CONFIDENCE' | 'FLAGGED';

export interface SignalBreakdown {
  text_place_match: number; // 0.0 - 1.0
  image_landmark: number; // 0.0 - 1.0
  time_plausibility: number; // 0.0 - 1.0
  spam_risk: number; // 0.0 - 1.0 (penalty)
}

// Internal scoring types
export interface TextAnalysisResult {
  score: number;
  entities: string[];
  matches: string[];
}

export interface ImageAnalysisResult {
  score: number;
  hasExif: boolean;
  exifLocation?: { lat: number; lng: number };
  isDuplicate: boolean;
  hash?: string;
}

export interface TimeAnalysisResult {
  score: number;
  isPlausible: boolean;
  reason: string;
}

export interface SpamAnalysisResult {
  risk: number; // 0.0 - 1.0
  reasons: string[];
}

