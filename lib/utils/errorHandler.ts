/**
 * Error handling utilities for validation
 */

import { ERROR_CODES, VALIDATION_CONSTANTS, type ErrorCode } from '@/lib/constants';

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Handles and formats validation errors for API responses
 */
export function handleValidationError(error: unknown): {
  error: string;
  code?: ErrorCode;
  statusCode: number;
} {
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: ERROR_CODES.UNKNOWN_ERROR,
      statusCode: 500,
    };
  }

  return {
    error: 'An unknown error occurred',
    code: ERROR_CODES.UNKNOWN_ERROR,
    statusCode: 500,
  };
}

/**
 * Validates geographic coordinates
 * @throws {ValidationError} if coordinates are invalid
 */
export function validateCoordinates(lat: number, lng: number): void {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    throw new ValidationError(
      'Invalid coordinates: latitude and longitude must be valid numbers',
      ERROR_CODES.INVALID_COORDS
    );
  }

  if (lat < VALIDATION_CONSTANTS.LATITUDE_MIN || lat > VALIDATION_CONSTANTS.LATITUDE_MAX) {
    throw new ValidationError(
      `Latitude must be between ${VALIDATION_CONSTANTS.LATITUDE_MIN} and ${VALIDATION_CONSTANTS.LATITUDE_MAX}`,
      ERROR_CODES.INVALID_LAT
    );
  }

  if (lng < VALIDATION_CONSTANTS.LONGITUDE_MIN || lng > VALIDATION_CONSTANTS.LONGITUDE_MAX) {
    throw new ValidationError(
      `Longitude must be between ${VALIDATION_CONSTANTS.LONGITUDE_MIN} and ${VALIDATION_CONSTANTS.LONGITUDE_MAX}`,
      ERROR_CODES.INVALID_LNG
    );
  }
}

/**
 * Validates text content for posts
 * @throws {ValidationError} if text is invalid
 */
export function validateText(text: unknown): asserts text is string {
  if (typeof text !== 'string') {
    throw new ValidationError('Text content must be a string', ERROR_CODES.MISSING_TEXT);
  }

  const trimmed = text.trim();
  if (trimmed.length < VALIDATION_CONSTANTS.TEXT_MIN_LENGTH) {
    throw new ValidationError(
      'Text content is required and cannot be empty',
      ERROR_CODES.MISSING_TEXT
    );
  }

  if (text.length > VALIDATION_CONSTANTS.TEXT_MAX_LENGTH) {
    throw new ValidationError(
      `Text content is too long (max ${VALIDATION_CONSTANTS.TEXT_MAX_LENGTH} characters)`,
      ERROR_CODES.TEXT_TOO_LONG
    );
  }
}

/**
 * Validates timestamp format (ISO 8601)
 * @throws {ValidationError} if timestamp is invalid
 */
export function validateTimestamp(timestamp: string): void {
  if (typeof timestamp !== 'string' || timestamp.trim().length === 0) {
    throw new ValidationError('Timestamp must be a non-empty string', ERROR_CODES.INVALID_TIMESTAMP);
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new ValidationError(
      'Invalid timestamp format. Expected ISO 8601 format (e.g., 2024-01-15T20:30:00Z)',
      ERROR_CODES.INVALID_TIMESTAMP
    );
  }
}

/**
 * Validates image file size
 * @throws {ValidationError} if image is too large
 */
export function validateImageSize(size: number): void {
  if (size > VALIDATION_CONSTANTS.IMAGE_MAX_SIZE_BYTES) {
    throw new ValidationError(
      `Image size exceeds maximum allowed size of ${VALIDATION_CONSTANTS.IMAGE_MAX_SIZE_MB}MB`,
      ERROR_CODES.IMAGE_TOO_LARGE
    );
  }
}

