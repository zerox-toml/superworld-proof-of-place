import type { SpamAnalysisResult } from '@/types';
import { VALIDATION_CONSTANTS } from '@/lib/constants';

/**
 * Detects spam and gaming attempts in location-tagged posts
 * 
 * This analyzer implements multiple detection mechanisms to identify
 * gaming patterns that could compromise the subnet's integrity.
 * 
 * Weight: 10% penalty on total score (applied as multiplier reduction)
 * 
 * Detection mechanisms:
 * - Duplicate text detection
 * - Short text spam
 * - Excessive hashtags
 * - URL spam
 * - Burst submission patterns
 * - Copy-paste patterns
 */
export class SpamAnalyzer {
  // In-memory storage for demo purposes
  // In production, this would use a distributed cache/database
  private static submissionHistory: Map<string, SubmissionRecord[]> = new Map();
  private static textHashes: Map<string, number> = new Map(); // text hash -> submission count

  /**
   * Analyzes content for spam/gaming patterns
   */
  static analyze(
    text: string,
    userId?: string,
    timestamp?: string
  ): SpamAnalysisResult {
    const reasons: string[] = [];
    let risk = 0.0;

    // Check for duplicate text
    const textHash = this.hashText(text);
    const duplicateCount = this.textHashes.get(textHash) || 0;
    if (duplicateCount > 0) {
      risk += 0.4;
      reasons.push(`Text appears ${duplicateCount} time(s) before`);
    }

    // Check for very short text (potential spam)
    if (text.length < VALIDATION_CONSTANTS.SPAM_SHORT_TEXT_LENGTH) {
      risk += 0.2;
      reasons.push(`Text is very short (${text.length} characters, minimum ${VALIDATION_CONSTANTS.SPAM_SHORT_TEXT_LENGTH} expected)`);
    }

    // Check for excessive hashtags (spam indicator)
    const hashtagMatches = text.match(/#\w+/g);
    const hashtagCount = hashtagMatches?.length || 0;
    if (hashtagCount > VALIDATION_CONSTANTS.SPAM_MAX_HASHTAGS) {
      risk += 0.2;
      reasons.push(`Excessive hashtags detected (${hashtagCount}, maximum ${VALIDATION_CONSTANTS.SPAM_MAX_HASHTAGS} allowed)`);
    }

    // Check for URL spam
    const urlMatches = text.match(/https?:\/\/\S+/g);
    const urlCount = urlMatches?.length || 0;
    if (urlCount > VALIDATION_CONSTANTS.SPAM_MAX_URLS) {
      risk += 0.3;
      reasons.push(`Multiple URLs detected (${urlCount}, maximum ${VALIDATION_CONSTANTS.SPAM_MAX_URLS} allowed)`);
    }

    // Check for burst submissions from same user
    if (userId) {
      const burstRisk = this.checkBurstSubmissions(userId, timestamp);
      if (burstRisk > 0) {
        risk += burstRisk;
        reasons.push('Burst submission pattern detected');
      }
    }

    // Check for copy-paste patterns (repeated phrases)
    const copyPasteRisk = this.detectCopyPaste(text);
    if (copyPasteRisk > 0) {
      risk += copyPasteRisk;
      reasons.push('Copy-paste pattern detected');
    }

    // Cap risk at 1.0
    risk = Math.min(1.0, risk);

    // Record this submission
    this.recordSubmission(text, userId, timestamp);

    return {
      risk,
      reasons: reasons.length > 0 ? reasons : ['No spam indicators'],
    };
  }

  /**
   * Creates a normalized hash of text for duplicate detection
   * 
   * Note: This is a simplified hash for demo purposes.
   * In production, use proper cryptographic hashing (e.g., SHA-256)
   * or semantic similarity matching for near-duplicate detection.
   */
  private static hashText(text: string): string {
    const normalized = text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s]/g, ''); // Remove punctuation for better matching
    
    // Use prefix as simple hash (production should use proper hash function)
    return normalized.substring(0, VALIDATION_CONSTANTS.TEXT_HASH_LENGTH);
  }

  /**
   * Checks for burst submissions (many submissions in short time)
   * This detects potential automated spam attacks
   */
  private static checkBurstSubmissions(
    userId: string,
    timestamp?: string
  ): number {
    if (!timestamp) return 0;

    const history = this.submissionHistory.get(userId) || [];
    const submissionTime = new Date(timestamp);
    
    // Check submissions within the burst detection window
    const windowStart = new Date(submissionTime.getTime() - VALIDATION_CONSTANTS.SPAM_BURST_WINDOW_MS);
    const recentSubmissions = history.filter(
      record => new Date(record.timestamp) > windowStart
    );

    const recentCount = recentSubmissions.length;

    if (recentCount >= VALIDATION_CONSTANTS.SPAM_BURST_HIGH_THRESHOLD) {
      return 0.5; // High risk - likely automated spam
    } else if (recentCount >= VALIDATION_CONSTANTS.SPAM_BURST_MEDIUM_THRESHOLD) {
      return 0.3; // Medium risk - suspicious pattern
    }

    return 0;
  }

  /**
   * Detects copy-paste patterns (repeated phrases)
   */
  private static detectCopyPaste(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const phraseLength = 5; // Check for 5-word phrases
    
    if (words.length < phraseLength * 2) {
      return 0; // Too short to detect patterns
    }

    const phrases = new Map<string, number>();
    
    // Extract all phrases
    for (let i = 0; i <= words.length - phraseLength; i++) {
      const phrase = words.slice(i, i + phraseLength).join(' ');
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }

    // Check for repeated phrases
    let maxRepeat = 0;
    phrases.forEach(count => {
      if (count > maxRepeat) {
        maxRepeat = count;
      }
    });

    if (maxRepeat >= 3) {
      return 0.4; // High copy-paste risk
    } else if (maxRepeat >= 2) {
      return 0.2; // Medium risk
    }

    return 0;
  }

  /**
   * Records a submission for future analysis
   */
  private static recordSubmission(
    text: string,
    userId?: string,
    timestamp?: string
  ): void {
    const textHash = this.hashText(text);
    this.textHashes.set(textHash, (this.textHashes.get(textHash) || 0) + 1);

    if (userId && timestamp) {
      const history = this.submissionHistory.get(userId) || [];
      history.push({
        timestamp,
        textHash,
      });
      
      // Keep only recent submission history to prevent unbounded growth
      const maxHistory = VALIDATION_CONSTANTS.MAX_SUBMISSION_HISTORY;
      if (history.length > maxHistory) {
        // Remove oldest entries (FIFO)
        history.splice(0, history.length - maxHistory);
      }
      
      this.submissionHistory.set(userId, history);
    }
  }
}

interface SubmissionRecord {
  timestamp: string;
  textHash: string;
}

