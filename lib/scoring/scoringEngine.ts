import type {
  ValidationRequest,
  ValidationResponse,
  Classification,
  SignalBreakdown,
} from '@/types';
import { TextAnalyzer } from '../analyzers/textAnalyzer';
import { ImageAnalyzer } from '../analyzers/imageAnalyzer';
import { TimeAnalyzer } from '../analyzers/timeAnalyzer';
import { SpamAnalyzer } from '../analyzers/spamAnalyzer';

/**
 * Main scoring engine for Proof-of-Place validation
 * 
 * Scoring Model:
 * - Text-Place Consistency: 40%
 * - Image Evidence: 30%
 * - Time Plausibility: 20%
 * - Anti-Spam: 10% (penalty)
 */
export class ScoringEngine {
  // Scoring weights
  private static readonly WEIGHTS = {
    TEXT_PLACE: 0.4,
    IMAGE: 0.3,
    TIME: 0.2,
    SPAM_PENALTY: 0.1, // This is a penalty, not a positive signal
  };

  // Classification thresholds
  private static readonly THRESHOLDS = {
    PASS: 0.70,
    LOW_CONFIDENCE: 0.40,
  };

  /**
   * Validates a location-tagged post and returns scoring breakdown
   */
  static async validate(request: ValidationRequest): Promise<ValidationResponse> {
    // Run all analyzers
    const textResult = TextAnalyzer.analyze(request.text, request.location);
    const imageResult = await ImageAnalyzer.analyze(request.image, request.location);
    const timeResult = TimeAnalyzer.analyze(request.timestamp, request.location);
    const spamResult = SpamAnalyzer.analyze(
      request.text,
      undefined, // userId - would come from auth in production
      request.timestamp
    );

    // Build signal breakdown
    const signals: SignalBreakdown = {
      text_place_match: textResult.score,
      image_landmark: imageResult.score,
      time_plausibility: timeResult.score,
      spam_risk: spamResult.risk,
    };

    // Calculate weighted base score
    const baseScore =
      textResult.score * this.WEIGHTS.TEXT_PLACE +
      imageResult.score * this.WEIGHTS.IMAGE +
      timeResult.score * this.WEIGHTS.TIME;

    // Apply spam penalty
    const finalScore = baseScore * (1 - spamResult.risk * this.WEIGHTS.SPAM_PENALTY);

    // Classify result
    const classification = this.classify(finalScore);

    // Generate explanation
    const explanation = this.generateExplanation(
      finalScore,
      classification,
      signals,
      {
        textMatches: textResult.matches,
        imageDuplicate: imageResult.isDuplicate,
        timeReason: timeResult.reason,
        spamReasons: spamResult.reasons,
      }
    );

    return {
      score: Math.max(0, Math.min(1, finalScore)), // Clamp to 0-1
      classification,
      signals,
      explanation,
    };
  }

  /**
   * Classifies score into PASS, LOW_CONFIDENCE, or FLAGGED
   */
  private static classify(score: number): Classification {
    if (score >= this.THRESHOLDS.PASS) {
      return 'PASS';
    } else if (score >= this.THRESHOLDS.LOW_CONFIDENCE) {
      return 'LOW_CONFIDENCE';
    } else {
      return 'FLAGGED';
    }
  }

  /**
   * Generates human-readable explanation
   */
  private static generateExplanation(
    score: number,
    classification: Classification,
    signals: SignalBreakdown,
    details: {
      textMatches: string[];
      imageDuplicate: boolean;
      timeReason: string;
      spamReasons: string[];
    }
  ): string {
    const parts: string[] = [];

    // Overall score
    parts.push(`Overall confidence score: ${(score * 100).toFixed(1)}%`);
    parts.push(`Classification: ${classification}`);

    // Text analysis
    if (signals.text_place_match >= 0.7) {
      parts.push(`✓ Strong location match in text (${details.textMatches.length} matches found)`);
    } else if (signals.text_place_match >= 0.4) {
      parts.push(`⚠ Moderate location match in text`);
    } else {
      parts.push(`✗ Weak or no location match in text`);
    }

    // Image analysis
    if (signals.image_landmark >= 0.7) {
      parts.push(`✓ Strong image evidence`);
    } else if (signals.image_landmark >= 0.4) {
      parts.push(`⚠ Moderate image evidence`);
    } else {
      parts.push(`✗ Weak or no image evidence`);
    }

    if (details.imageDuplicate) {
      parts.push(`⚠ Image appears to be reused from another location`);
    }

    // Time analysis
    parts.push(`Time plausibility: ${details.timeReason}`);

    // Spam analysis
    if (signals.spam_risk > 0.3) {
      parts.push(`⚠ Spam indicators detected: ${details.spamReasons.join(', ')}`);
    } else if (signals.spam_risk > 0) {
      parts.push(`Minor spam indicators: ${details.spamReasons[0]}`);
    } else {
      parts.push(`✓ No spam indicators detected`);
    }

    return parts.join('\n');
  }
}

