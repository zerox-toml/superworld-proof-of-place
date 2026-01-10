import type { ImageAnalysisResult, LocationInput } from '@/types';
import { VALIDATION_CONSTANTS } from '@/lib/constants';

/**
 * Analyzes image evidence for geo-consistency validation
 * 
 * This analyzer validates visual evidence of location claims through:
 * - EXIF GPS data extraction and distance calculation
 * - Image duplicate detection (cross-location tracking)
 * - Visual landmark recognition (future enhancement)
 * 
 * Weight: 30% of total score
 * 
 * Scoring strategy:
 * - EXIF GPS match: High confidence if within close proximity
 * - No image: Neutral score (0.5), not penalized
 * - Duplicate image: Heavy penalty (×0.3 multiplier)
 */
export class ImageAnalyzer {
  // In-memory storage for duplicate detection
  // In production, this would use a distributed cache/database
  private static imageHashes: Map<string, string[]> = new Map(); // hash -> list of location keys

  /**
   * Analyzes image for location consistency
   */
  static async analyze(
    image: File | string | undefined,
    location: LocationInput
  ): Promise<ImageAnalysisResult> {
    if (!image) {
      // No image provided - neutral score (not zero)
      return {
        score: 0.5,
        hasExif: false,
        isDuplicate: false,
      };
    }

    // For demo: we'll use a simple hash-based approach
    // In production, this would use proper image processing libraries
    const hash = await this.computeImageHash(image);
    const isDuplicate = this.checkDuplicate(hash, location);
    const hasExif = await this.checkExif(image);
    const exifLocation = hasExif ? await this.extractExifLocation(image) : undefined;

    let score = 0.5; // Base score when image exists

    // EXIF GPS match is a strong signal for geo-consistency
    if (exifLocation && location.type === 'coordinates') {
      const distance = this.calculateDistance(
        exifLocation.lat,
        exifLocation.lng,
        location.lat,
        location.lng
      );

      // Score based on distance using Haversine formula
      if (distance < VALIDATION_CONSTANTS.IMAGE_EXIF_DISTANCE_CLOSE_M) {
        score = 0.9; // Very close - high confidence
      } else if (distance < VALIDATION_CONSTANTS.IMAGE_EXIF_DISTANCE_NEAR_M) {
        score = 0.7; // Close - medium-high confidence
      } else if (distance < VALIDATION_CONSTANTS.IMAGE_EXIF_DISTANCE_ACCEPTABLE_M) {
        score = 0.5; // Acceptable - moderate confidence
      } else {
        score = 0.2; // Too far - low confidence
      }
    }

    // Apply duplicate image penalty
    // This prevents gaming by reusing images across different locations
    if (isDuplicate) {
      score *= VALIDATION_CONSTANTS.IMAGE_DUPLICATE_PENALTY; // Heavy penalty
    }

    // Store hash for future duplicate detection
    if (hash) {
      this.storeImageHash(hash, location);
    }

    return {
      score,
      hasExif,
      exifLocation,
      isDuplicate,
      hash,
    };
  }

  /**
   * Computes a hash for duplicate detection
   * 
   * Note: This is a simplified hash for demo purposes.
   * In production, use proper perceptual hashing (e.g., pHash, dHash)
   * to detect similar images even with minor modifications.
   * 
   * @param image - Image file or base64 string
   * @returns Hash string or undefined if hashing fails
   */
  private static async computeImageHash(
    image: File | string
  ): Promise<string | undefined> {
    try {
      if (typeof image === 'string') {
        // Base64 string - use prefix as simple hash
        // In production, decode and compute perceptual hash
        return image.substring(0, VALIDATION_CONSTANTS.IMAGE_HASH_PREFIX_LENGTH);
      }

      // For File objects, use metadata-based hash
      // In production, read file content and compute perceptual hash
      if (image instanceof File) {
        return `${image.name}_${image.size}_${image.type || 'unknown'}`;
      }

      return undefined;
    } catch (error) {
      // Log error but don't fail validation if hashing fails
      console.error('[ImageAnalyzer] Error computing image hash:', error);
      return undefined;
    }
  }

  /**
   * Checks if image has EXIF data
   */
  private static async checkExif(image: File | string): Promise<boolean> {
    // In production, use exifr or similar library
    // For demo, return false (EXIF extraction requires proper library)
    return false;
  }

  /**
   * Extracts GPS location from EXIF
   */
  private static async extractExifLocation(
    image: File | string
  ): Promise<{ lat: number; lng: number } | undefined> {
    // In production, use exifr library:
    // const exif = await exifr.parse(image);
    // return exif?.latitude && exif?.longitude ? { lat: exif.latitude, lng: exif.longitude } : undefined;
    return undefined;
  }

  /**
   * Checks if image was used at different locations (duplicate detection)
   */
  private static checkDuplicate(
    hash: string | undefined,
    location: LocationInput
  ): boolean {
    if (!hash) return false;

    const locationKey = this.getLocationKey(location);
    const existingLocations = this.imageHashes.get(hash) || [];

    if (existingLocations.length === 0) {
      return false; // First time seeing this image
    }

    // Check if image was used at different location
    return !existingLocations.includes(locationKey);
  }

  /**
   * Stores image hash for duplicate detection
   */
  private static storeImageHash(
    hash: string | undefined,
    location: LocationInput
  ): void {
    if (!hash) return;

    const locationKey = this.getLocationKey(location);
    const existing = this.imageHashes.get(hash) || [];
    if (!existing.includes(locationKey)) {
      existing.push(locationKey);
      this.imageHashes.set(hash, existing);
    }
  }

  /**
   * Gets a string key for location
   */
  private static getLocationKey(location: LocationInput): string {
    if (location.type === 'poi') {
      return `${location.name}_${location.city}`;
    }
    return `${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;
  }

  /**
   * Calculates the great-circle distance between two geographic coordinates
   * using the Haversine formula.
   * 
   * This is accurate for distances up to a few hundred kilometers.
   * For longer distances, consider using more sophisticated formulas.
   * 
   * @param lat1 - Latitude of first point (in degrees)
   * @param lng1 - Longitude of first point (in degrees)
   * @param lat2 - Latitude of second point (in degrees)
   * @param lng2 - Longitude of second point (in degrees)
   * @returns Distance in meters
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const EARTH_RADIUS_M = 6371000; // Earth's mean radius in meters

    // Convert degrees to radians
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    // Haversine formula
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return EARTH_RADIUS_M * c;
  }

  /**
   * Converts degrees to radians
   * 
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

