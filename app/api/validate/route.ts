import { NextRequest, NextResponse } from 'next/server';
import { ScoringEngine } from '@/lib/scoring/scoringEngine';
import { handleValidationError, validateText, validateCoordinates, validateTimestamp } from '@/lib/utils/errorHandler';
import type { ValidationRequest, ValidationResponse } from '@/types';

/**
 * POST /api/validate
 * Validates a location-tagged social media post
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const text = formData.get('text') as string;
    const image = formData.get('image') as File | null;
    const locationType = formData.get('locationType') as string;
    const timestamp = formData.get('timestamp') as string | null;

    // Validate text
    validateText(text);

    // Parse and validate location
    let location;
    if (locationType === 'coordinates') {
      const lat = parseFloat(formData.get('lat') as string);
      const lng = parseFloat(formData.get('lng') as string);
      
      validateCoordinates(lat, lng);
      location = { type: 'coordinates' as const, lat, lng };
    } else if (locationType === 'poi') {
      const name = formData.get('poiName') as string;
      const city = formData.get('city') as string;
      
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'POI name is required' },
          { status: 400 }
        );
      }
      
      if (!city || city.trim().length === 0) {
        return NextResponse.json(
          { error: 'City is required' },
          { status: 400 }
        );
      }
      
      location = { type: 'poi' as const, name: name.trim(), city: city.trim() };
    } else {
      return NextResponse.json(
        { error: 'Invalid location type. Must be "coordinates" or "poi"' },
        { status: 400 }
      );
    }

    // Validate timestamp if provided
    const finalTimestamp = timestamp || new Date().toISOString();
    if (timestamp) {
      validateTimestamp(timestamp);
    }

    // Validate image size if provided
    if (image && image.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { error: 'Image size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Build validation request
    const validationRequest: ValidationRequest = {
      text: text.trim(),
      image: image || undefined,
      location,
      timestamp: finalTimestamp,
    };

    // Run validation
    const result: ValidationResponse = await ScoringEngine.validate(validationRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Validation error:', error);
    const { error: errorMessage, statusCode } = handleValidationError(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
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

