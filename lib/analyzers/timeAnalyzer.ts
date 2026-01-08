import type { TimeAnalysisResult, LocationInput } from '@/types';

/**
 * Analyzes timestamp plausibility
 * Weight: 20% of total score
 */
export class TimeAnalyzer {
  /**
   * Analyzes if timestamp is plausible for the location/event
   */
  static analyze(
    timestamp: string | undefined,
    location: LocationInput
  ): TimeAnalysisResult {
    if (!timestamp) {
      // No timestamp provided - neutral score
      return {
        score: 0.5,
        isPlausible: true,
        reason: 'No timestamp provided',
      };
    }

    const postTime = new Date(timestamp);
    const now = new Date();

    // Check if timestamp is in the future
    if (postTime > now) {
      return {
        score: 0.1,
        isPlausible: false,
        reason: 'Timestamp is in the future',
      };
    }

    // Check if timestamp is too old (more than 1 year)
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    if (postTime < oneYearAgo) {
      return {
        score: 0.3,
        isPlausible: false,
        reason: 'Timestamp is more than 1 year old',
      };
    }

    // Check time of day plausibility based on venue type
    const hour = postTime.getHours();
    const venueType = this.inferVenueType(location);
    const timeScore = this.checkTimePlausibility(hour, venueType);

    // Check if it's within reasonable event hours
    const isEventHours = this.isWithinEventHours(hour, venueType);

    let score = 0.5; // Base score
    let reason = 'Timestamp is valid';

    if (isEventHours) {
      score = 0.9;
      reason = `Time is within typical ${venueType} hours`;
    } else if (timeScore > 0.5) {
      score = 0.7;
      reason = 'Time is plausible for venue type';
    } else {
      score = 0.4;
      reason = 'Time is outside typical hours for venue type';
    }

    return {
      score,
      isPlausible: score >= 0.4,
      reason,
    };
  }

  /**
   * Infers venue type from location name
   */
  private static inferVenueType(location: LocationInput): string {
    const name = location.type === 'poi' 
      ? location.name.toLowerCase() 
      : 'unknown';

    if (name.includes('stadium') || name.includes('arena')) {
      return 'sports_venue';
    }
    if (name.includes('theater') || name.includes('theatre') || name.includes('hall')) {
      return 'performance_venue';
    }
    if (name.includes('restaurant') || name.includes('cafe') || name.includes('bar')) {
      return 'dining';
    }
    if (name.includes('park') || name.includes('plaza')) {
      return 'outdoor';
    }
    if (name.includes('museum') || name.includes('gallery')) {
      return 'cultural';
    }

    return 'general';
  }

  /**
   * Checks if hour is plausible for venue type
   */
  private static checkTimePlausibility(hour: number, venueType: string): number {
    switch (venueType) {
      case 'sports_venue':
        // Sports events typically 7pm-11pm
        if (hour >= 19 && hour <= 23) return 0.9;
        if (hour >= 12 && hour <= 18) return 0.7; // Afternoon games
        if (hour >= 0 && hour <= 6) return 0.2; // Very late/early
        return 0.5;

      case 'performance_venue':
        // Shows typically 7pm-11pm
        if (hour >= 19 && hour <= 23) return 0.9;
        if (hour >= 14 && hour <= 18) return 0.6; // Matinee
        if (hour >= 0 && hour <= 6) return 0.2;
        return 0.4;

      case 'dining':
        // Restaurants: 11am-10pm
        if (hour >= 11 && hour <= 22) return 0.9;
        if (hour >= 7 && hour <= 10) return 0.7; // Breakfast
        if (hour >= 23 || hour <= 6) return 0.3;
        return 0.5;

      case 'outdoor':
        // Parks: 6am-9pm
        if (hour >= 6 && hour <= 21) return 0.9;
        if (hour >= 22 || hour <= 5) return 0.4;
        return 0.7;

      case 'cultural':
        // Museums: 10am-6pm typically
        if (hour >= 10 && hour <= 18) return 0.9;
        if (hour >= 19 || hour <= 9) return 0.4;
        return 0.6;

      default:
        // General: most hours are plausible
        if (hour >= 8 && hour <= 22) return 0.8;
        return 0.5;
    }
  }

  /**
   * Checks if hour is within typical event hours
   */
  private static isWithinEventHours(hour: number, venueType: string): boolean {
    switch (venueType) {
      case 'sports_venue':
      case 'performance_venue':
        return hour >= 19 && hour <= 23;
      case 'dining':
        return hour >= 11 && hour <= 22;
      case 'outdoor':
        return hour >= 6 && hour <= 21;
      case 'cultural':
        return hour >= 10 && hour <= 18;
      default:
        return hour >= 8 && hour <= 22;
    }
  }
}

