import type { TextAnalysisResult, LocationInput } from '@/types';

/**
 * Analyzes text content for location consistency
 * Weight: 40% of total score
 */
export class TextAnalyzer {
  /**
   * Analyzes text for location mentions and consistency
   */
  static analyze(text: string, location: LocationInput): TextAnalysisResult {
    const normalizedText = text.toLowerCase();
    const entities = this.extractEntities(normalizedText);
    const matches = this.findLocationMatches(normalizedText, location, entities);
    const score = this.calculateScore(matches, location);

    return {
      score,
      entities,
      matches,
    };
  }

  /**
   * Extracts location-related entities from text
   */
  private static extractEntities(text: string): string[] {
    const entities: string[] = [];

    // Common venue keywords
    const venueKeywords = [
      'theater', 'theatre', 'stadium', 'arena', 'hall', 'center', 'centre',
      'venue', 'club', 'bar', 'restaurant', 'cafe', 'museum', 'gallery',
      'park', 'plaza', 'square', 'bridge', 'tower', 'building'
    ];

    // Extract venue keywords
    venueKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        entities.push(keyword);
      }
    });

    // Extract common abbreviations (MSG, NYC, LA, etc.)
    const abbreviations = text.match(/\b[A-Z]{2,}\b/g) || [];
    entities.push(...abbreviations.map(abbr => abbr.toLowerCase()));

    // Extract quoted phrases (likely venue names)
    const quoted = text.match(/"([^"]+)"/g) || [];
    quoted.forEach(q => {
      entities.push(q.replace(/"/g, '').toLowerCase());
    });

    return [...new Set(entities)]; // Remove duplicates
  }

  /**
   * Finds matches between text and claimed location
   */
  private static findLocationMatches(
    text: string,
    location: LocationInput,
    entities: string[]
  ): string[] {
    const matches: string[] = [];

    if (location.type === 'poi') {
      const poiName = location.name.toLowerCase();
      const city = location.city.toLowerCase();

      // Check for exact POI name match
      if (text.includes(poiName)) {
        matches.push(`exact_poi:${poiName}`);
      }

      // Check for POI name parts
      const poiWords = poiName.split(/\s+/);
      poiWords.forEach(word => {
        if (word.length > 3 && text.includes(word)) {
          matches.push(`poi_word:${word}`);
        }
      });

      // Check for city mention
      if (text.includes(city)) {
        matches.push(`city:${city}`);
      }

      // Check for common nicknames/abbreviations
      const nicknames = this.getNicknames(poiName);
      nicknames.forEach(nickname => {
        if (text.includes(nickname)) {
          matches.push(`nickname:${nickname}`);
        }
      });

      // Check entities against POI
      entities.forEach(entity => {
        if (poiName.includes(entity) || entity.includes(poiName.split(' ')[0])) {
          matches.push(`entity:${entity}`);
        }
      });
    } else {
      // For coordinates, we can only check for city/neighborhood mentions
      // This is a limitation - we'd need a reverse geocoding service for better results
      const cityKeywords = ['new york', 'nyc', 'los angeles', 'la', 'chicago', 'san francisco'];
      cityKeywords.forEach(city => {
        if (text.includes(city)) {
          matches.push(`city_mention:${city}`);
        }
      });
    }

    return [...new Set(matches)];
  }

  /**
   * Gets common nicknames for well-known venues
   */
  private static getNicknames(poiName: string): string[] {
    const nicknameMap: Record<string, string[]> = {
      'madison square garden': ['msg', 'the garden'],
      'staples center': ['staples'],
      'yankee stadium': ['yankee', 'yankees'],
      'dodger stadium': ['dodger', 'dodgers'],
      'wembley stadium': ['wembley'],
      'olympic stadium': ['olympic'],
    };

    const lowerPoi = poiName.toLowerCase();
    return nicknameMap[lowerPoi] || [];
  }

  /**
   * Calculates score based on matches
   */
  private static calculateScore(
    matches: string[],
    location: LocationInput
  ): number {
    if (matches.length === 0) {
      return 0.1; // No matches = very low score
    }

    let score = 0.0;

    // Exact POI match is strongest signal
    if (matches.some(m => m.startsWith('exact_poi:'))) {
      score += 0.5;
    }

    // POI word matches
    const poiWordMatches = matches.filter(m => m.startsWith('poi_word:')).length;
    score += Math.min(0.3, poiWordMatches * 0.1);

    // Nickname matches
    if (matches.some(m => m.startsWith('nickname:'))) {
      score += 0.3;
    }

    // City mention
    if (matches.some(m => m.startsWith('city:'))) {
      score += 0.2;
    }

    // Entity matches
    const entityMatches = matches.filter(m => m.startsWith('entity:')).length;
    score += Math.min(0.2, entityMatches * 0.05);

    // For coordinates without POI, lower the max score
    if (location.type === 'coordinates') {
      score *= 0.7; // Penalty for lack of POI context
    }

    // Cap at 1.0
    return Math.min(1.0, score);
  }
}

