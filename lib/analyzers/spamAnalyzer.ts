import type { SpamAnalysisResult } from '@/types';

/**
 * Detects spam and gaming attempts
 * Weight: 10% penalty on total score
 */
export class SpamAnalyzer {
  private static submissionHistory: Map<string, SubmissionRecord[]> = new Map();
  private static textHashes: Map<string, number> = new Map(); // text hash -> count

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
    if (text.length < 10) {
      risk += 0.2;
      reasons.push('Text is very short');
    }

    // Check for excessive hashtags (spam indicator)
    const hashtagCount = (text.match(/#\w+/g) || []).length;
    if (hashtagCount > 10) {
      risk += 0.2;
      reasons.push('Excessive hashtags detected');
    }

    // Check for URL spam
    const urlCount = (text.match(/https?:\/\/\S+/g) || []).length;
    if (urlCount > 3) {
      risk += 0.3;
      reasons.push('Multiple URLs detected');
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
   * Hashes text for duplicate detection
   */
  private static hashText(text: string): string {
    // Simple hash - in production use proper hashing
    const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
    return normalized.substring(0, 100); // Use first 100 chars as hash
  }

  /**
   * Checks for burst submissions (many submissions in short time)
   */
  private static checkBurstSubmissions(
    userId: string,
    timestamp?: string
  ): number {
    if (!timestamp) return 0;

    const history = this.submissionHistory.get(userId) || [];
    const submissionTime = new Date(timestamp);
    
    // Check submissions in last 5 minutes
    const fiveMinutesAgo = new Date(submissionTime.getTime() - 5 * 60 * 1000);
    const recentSubmissions = history.filter(
      record => new Date(record.timestamp) > fiveMinutesAgo
    );

    if (recentSubmissions.length >= 5) {
      return 0.5; // High risk
    } else if (recentSubmissions.length >= 3) {
      return 0.3; // Medium risk
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
      
      // Keep only last 100 submissions per user
      if (history.length > 100) {
        history.shift();
      }
      
      this.submissionHistory.set(userId, history);
    }
  }
}

interface SubmissionRecord {
  timestamp: string;
  textHash: string;
}

