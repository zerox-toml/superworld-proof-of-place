# SuperWorld - Proof-of-Place Validation System

## Overview

This is a **Proof-of-Place validation demo** for SuperWorld's proposed Bittensor subnet. The system implements geo-consistency scoring for location-tagged social media posts, aligning with SuperWorld's Executive Summary for a DePIN subnet that enriches social content with real-time geospatial intelligence.

**Core Concept**: Verify that a social media post (text + image) plausibly belongs at its claimed location, using multi-modal validation (text analysis, image evidence, time plausibility, anti-gaming).

**Subnet Goal**: Enable real-time validation of social posts from X, Reddit, YouTube (via Subnet 13 Data Universe) to create a verified geospatial intelligence layer for the SuperWorld app.

## Quick Start

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

The app will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── validate/        # Validation API endpoint
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── ValidationForm.tsx   # Form for submitting posts
│   └── ResultsDisplay.tsx   # Results visualization
├── lib/
│   ├── analyzers/           # Core analyzers
│   │   ├── textAnalyzer.ts
│   │   ├── imageAnalyzer.ts
│   │   ├── timeAnalyzer.ts
│   │   └── spamAnalyzer.ts
│   ├── scoring/
│   │   └── scoringEngine.ts # Main scoring engine
│   └── utils/
│       └── errorHandler.ts  # Error handling utilities
└── types/
    └── index.ts             # TypeScript type definitions
```

## How It Works

### 1. User Submits Post
- Text content (required)
- Optional image
- Location (POI name + city OR coordinates)
- Optional timestamp

### 2. System Analyzes
The scoring engine runs four analyzers:

- **Text Analyzer (40%)**: Checks if text mentions the location
- **Image Analyzer (30%)**: Validates image evidence (EXIF, duplicates)
- **Time Analyzer (20%)**: Checks timestamp plausibility
- **Spam Analyzer (10%)**: Detects gaming patterns (penalty)

### 3. System Returns
- **Confidence Score** (0.0 - 1.0)
- **Classification**: PASS / LOW_CONFIDENCE / FLAGGED
- **Signal Breakdown**: Detailed scores for each analyzer
- **Explanation**: Human-readable reasoning

## API Usage

### POST /api/validate

**Request** (multipart/form-data):
```
text: string (required)
image: File (optional)
locationType: "coordinates" | "poi"
lat: number (if coordinates)
lng: number (if coordinates)
poiName: string (if poi)
city: string (if poi)
timestamp: string (optional, ISO 8601)
```

**Response**:
```json
{
  "score": 0.85,
  "classification": "PASS",
  "signals": {
    "text_place_match": 0.9,
    "image_landmark": 0.7,
    "time_plausibility": 0.9,
    "spam_risk": 0.05
  },
  "explanation": "Overall confidence score: 85.0%..."
}
```

## Testing Examples

### Example 1: Strong Match
- Text: "Amazing concert at Madison Square Garden! #MSG"
- Location: POI "Madison Square Garden", City "New York"
- Expected: High score (PASS)

### Example 2: Weak Match
- Text: "Having fun!"
- Location: Coordinates (40.7505, -73.9934)
- Expected: Low score (LOW_CONFIDENCE or FLAGGED)

### Example 3: Spam Detection
- Text: "Great place!" (repeated 5 times)
- Location: Different locations each time
- Expected: High spam risk, low final score

## Classification Thresholds

- **PASS**: Score ≥ 0.70
- **LOW_CONFIDENCE**: 0.40 ≤ Score < 0.70
- **FLAGGED**: Score < 0.40

## Anti-Gaming Features

1. **Duplicate Detection**: Tracks text/image hashes across submissions
2. **Spam Patterns**: Detects burst submissions, excessive hashtags, URLs
3. **Time Validation**: Rejects future dates, validates against venue types
4. **Location Consistency**: Ensures text mentions match claimed location

## Next Steps

See `ANTI_GAMING.md` for:
- Detailed anti-gaming strategy
- Subnet scaling plan
- TAO incentive design
- Implementation roadmap

## Technologies

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Server Actions**: API routes for validation
