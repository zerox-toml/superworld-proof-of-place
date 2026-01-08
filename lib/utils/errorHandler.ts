/**
 * Error handling utilities for validation
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleValidationError(error: unknown): {
  error: string;
  statusCode: number;
} {
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      statusCode: 500,
    };
  }

  return {
    error: 'An unknown error occurred',
    statusCode: 500,
  };
}

/**
 * Validates coordinates
 */
export function validateCoordinates(lat: number, lng: number): void {
  if (isNaN(lat) || isNaN(lng)) {
    throw new ValidationError('Invalid coordinates: must be numbers', 'INVALID_COORDS');
  }

  if (lat < -90 || lat > 90) {
    throw new ValidationError('Latitude must be between -90 and 90', 'INVALID_LAT');
  }

  if (lng < -180 || lng > 180) {
    throw new ValidationError('Longitude must be between -180 and 180', 'INVALID_LNG');
  }
}

/**
 * Validates text content
 */
export function validateText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new ValidationError('Text content is required', 'MISSING_TEXT');
  }

  if (text.length > 10000) {
    throw new ValidationError('Text content is too long (max 10,000 characters)', 'TEXT_TOO_LONG');
  }
}

/**
 * Validates timestamp
 */
export function validateTimestamp(timestamp: string): void {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new ValidationError('Invalid timestamp format', 'INVALID_TIMESTAMP');
  }
}

