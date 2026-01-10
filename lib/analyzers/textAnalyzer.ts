import type { TextAnalysisResult, LocationInput } from '@/types';
import { VALIDATION_CONSTANTS } from '@/lib/constants';

/**
 * Analyzes text content for location consistency
 * 
 * This analyzer extracts location-related entities from text and matches them
 * against the claimed location to compute a geo-consistency score.
 * 
 * Weight: 40% of total score (strongest signal - direct evidence)
 * 
 * Matching strategies:
 * - Exact POI name match: Strongest signal
 * - POI word matches: Individual words from venue name
 * - Nickname resolution: Common abbreviations (MSG → Madison Square Garden)
 * - City mention: Validates broader location context
 * - Entity extraction: Venue keywords and location indicators
 * 
 * Penalties:
 * - Coordinates without POI: Reduced max score (less context)
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

      // Check for POI name parts (individual words)
      const poiWords = poiName.split(/\s+/);
      poiWords.forEach(word => {
        // Only consider words longer than minimum length to avoid false matches
        if (word.length > VALIDATION_CONSTANTS.MIN_POI_WORD_LENGTH && text.includes(word)) {
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
  /**
   * Calculates geo-consistency score based on matches found
   * 
   * Scoring is additive with maximum caps to prevent over-scoring.
   * Higher match types (exact POI) are weighted more heavily than
   * partial matches (city mentions, entities).
   */
  private static calculateScore(
    matches: string[],
    location: LocationInput
  ): number {
    if (matches.length === 0) {
      return VALIDATION_CONSTANTS.TEXT_NO_MATCHES_SCORE; // No matches = very low score
    }

    let score = 0.0;

    // Exact POI match is strongest signal (most reliable evidence)
    if (matches.some(m => m.startsWith('exact_poi:'))) {
      score += VALIDATION_CONSTANTS.TEXT_EXACT_POI_MATCH_SCORE;
    }

    // POI word matches (partial venue name matches)
    const poiWordMatches = matches.filter(m => m.startsWith('poi_word:')).length;
    const poiWordScore = poiWordMatches * VALIDATION_CONSTANTS.TEXT_POI_WORD_MATCH_BASE;
    score += Math.min(VALIDATION_CONSTANTS.TEXT_POI_WORD_MATCH_MAX, poiWordScore);

    // Nickname matches (common abbreviations)
    if (matches.some(m => m.startsWith('nickname:'))) {
      score += VALIDATION_CONSTANTS.TEXT_NICKNAME_MATCH_SCORE;
    }

    // City mention (broader location context)
    if (matches.some(m => m.startsWith('city:'))) {
      score += VALIDATION_CONSTANTS.TEXT_CITY_MENTION_SCORE;
    }

    // Entity matches (venue keywords, location indicators)
    const entityMatches = matches.filter(m => m.startsWith('entity:')).length;
    const entityScore = entityMatches * VALIDATION_CONSTANTS.TEXT_ENTITY_MATCH_BASE;
    score += Math.min(VALIDATION_CONSTANTS.TEXT_ENTITY_MATCH_MAX, entityScore);

    // Penalty for coordinates without POI context
    // Less context available means lower maximum achievable score
    if (location.type === 'coordinates') {
      score *= VALIDATION_CONSTANTS.TEXT_COORDINATES_PENALTY;
    }

    // Clamp to valid score range [0.0, 1.0]
    return Math.min(VALIDATION_CONSTANTS.SCORE_MAX, Math.max(VALIDATION_CONSTANTS.SCORE_MIN, score));
  }
}

