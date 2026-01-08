import type { ImageAnalysisResult, LocationInput } from '@/types';

/**
 * Analyzes image for location evidence
 * Weight: 30% of total score
 */
export class ImageAnalyzer {
  private static imageHashes: Map<string, string[]> = new Map(); // hash -> locations

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

    // EXIF GPS match is strong signal
    if (exifLocation && location.type === 'coordinates') {
      const distance = this.calculateDistance(
        exifLocation.lat,
        exifLocation.lng,
        location.lat,
        location.lng
      );
      if (distance < 100) { // Within 100 meters
        score = 0.9;
      } else if (distance < 1000) { // Within 1km
        score = 0.7;
      } else if (distance < 5000) { // Within 5km
        score = 0.5;
      } else {
        score = 0.2; // Too far
      }
    }

    // Duplicate image penalty
    if (isDuplicate) {
      score *= 0.3; // Heavy penalty
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
   * Computes a simple hash for duplicate detection
   * In production, use proper image hashing (e.g., perceptual hash)
   */
  private static async computeImageHash(
    image: File | string
  ): Promise<string | undefined> {
    try {
      if (typeof image === 'string') {
        // Base64 string - use as hash (simplified)
        return image.substring(0, 50); // Use first 50 chars as simple hash
      }

      // For File objects, we'd need to read and hash
      // For demo, use file name + size as hash
      return `${image.name}_${image.size}`;
    } catch (error) {
      console.error('Error computing image hash:', error);
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
   * Calculates distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

