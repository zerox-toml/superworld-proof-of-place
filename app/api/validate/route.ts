import { NextRequest, NextResponse } from 'next/server';
import { ScoringEngine } from '@/lib/scoring/scoringEngine';
import {
  handleValidationError,
  validateText,
  validateCoordinates,
  validateTimestamp,
  validateImageSize,
  ValidationError,
} from '@/lib/utils/errorHandler';
import { ERROR_CODES, VALIDATION_CONSTANTS } from '@/lib/constants';
import type { ValidationRequest, ValidationResponse, LocationInput } from '@/types';

/**
 * POST /api/validate
 * 
 * Validates a location-tagged social media post for geo-consistency.
 * 
 * @param request - Next.js request object containing multipart/form-data
 * @returns ValidationResponse with score, classification, and explanation
 * 
 * Request format (multipart/form-data):
 * - text: string (required) - Post content
 * - image: File (optional) - Image file
 * - locationType: "coordinates" | "poi" (required)
 * - lat: number (if locationType === "coordinates")
 * - lng: number (if locationType === "coordinates")
 * - poiName: string (if locationType === "poi")
 * - city: string (if locationType === "poi")
 * - timestamp: string (optional) - ISO 8601 format
 */
export async function POST(request: NextRequest): Promise<NextResponse<ValidationResponse | { error: string; code?: string }>> {
  try {
    const formData = await request.formData();

    // Extract and validate text content
    const textValue = formData.get('text');
    validateText(textValue);
    const text = (textValue as string).trim();

    // Extract image if provided
    const imageFile = formData.get('image');
    const image = imageFile instanceof File ? imageFile : null;

    // Extract location type and validate
    const locationType = formData.get('locationType');
    if (typeof locationType !== 'string') {
      throw new ValidationError(
        'Location type is required',
        ERROR_CODES.INVALID_LOCATION_TYPE
      );
    }

    // Parse location based on type
    let location: LocationInput;
    if (locationType === 'coordinates') {
      const latStr = formData.get('lat');
      const lngStr = formData.get('lng');

      if (typeof latStr !== 'string' || typeof lngStr !== 'string') {
        throw new ValidationError(
          'Latitude and longitude are required for coordinate locations',
          ERROR_CODES.INVALID_COORDS
        );
      }

      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      validateCoordinates(lat, lng);

      location = { type: 'coordinates', lat, lng };
    } else if (locationType === 'poi') {
      const nameValue = formData.get('poiName');
      const cityValue = formData.get('city');

      if (typeof nameValue !== 'string' || nameValue.trim().length === 0) {
        throw new ValidationError(
          'POI name is required',
          ERROR_CODES.MISSING_POI_NAME
        );
      }

      if (typeof cityValue !== 'string' || cityValue.trim().length === 0) {
        throw new ValidationError(
          'City is required for POI locations',
          ERROR_CODES.MISSING_CITY
        );
      }

      location = {
        type: 'poi',
        name: nameValue.trim(),
        city: cityValue.trim(),
      };
    } else {
      throw new ValidationError(
        `Invalid location type. Must be "coordinates" or "poi", got: ${locationType}`,
        ERROR_CODES.INVALID_LOCATION_TYPE
      );
    }

    // Extract and validate timestamp
    const timestampValue = formData.get('timestamp');
    const timestamp = typeof timestampValue === 'string' ? timestampValue.trim() : null;
    const finalTimestamp = timestamp || new Date().toISOString();

    if (timestamp) {
      validateTimestamp(timestamp);
    }

    // Validate image size if provided
    if (image) {
      validateImageSize(image.size);
    }

    // Build validation request
    const validationRequest: ValidationRequest = {
      text,
      image: image || undefined,
      location,
      timestamp: finalTimestamp,
    };

    // Run validation through scoring engine
    const result = await ScoringEngine.validate(validationRequest);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error('[Validation API] Error:', error instanceof Error ? error.message : 'Unknown error', {
      timestamp: new Date().toISOString(),
      error: error instanceof ValidationError ? error.code : 'UNKNOWN',
    });

    const errorResponse = handleValidationError(error);
    return NextResponse.json(
      {
        error: errorResponse.error,
        code: errorResponse.code,
      },
      {
        status: errorResponse.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * GET /api/validate (for testing with JSON)
 * Alternative endpoint that accepts JSON instead of form data
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method to validate posts',
    example: {
      method: 'POST',
      contentType: 'multipart/form-data',
      fields: {
        text: 'string (required)',
        image: 'File (optional)',
        locationType: "'coordinates' | 'poi'",
        lat: 'number (if coordinates)',
        lng: 'number (if coordinates)',
        poiName: 'string (if poi)',
        city: 'string (if poi)',
        timestamp: 'ISO 8601 string (optional)',
      },
    },
  });
}

