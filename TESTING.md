# Testing Guide

## Quick Test

### 1. Start the Development Server

```bash
cd frontend
yarn dev
```

Server will start at `http://localhost:3000`

### 2. Test via UI

1. Open `http://localhost:3000` in browser
2. Fill out the form:
   - **Text**: "Amazing concert at Madison Square Garden! #MSG"
   - **Location Type**: POI Name
   - **POI Name**: "Madison Square Garden"
   - **City**: "New York"
   - **Timestamp**: Leave empty (uses current time)
3. Click "Validate Post"
4. See results with score breakdown

### 3. Test via API (curl)

```bash
# Test with POI
curl -X POST http://localhost:3000/api/validate \
  -F "text=Amazing concert at Madison Square Garden! #MSG" \
  -F "locationType=poi" \
  -F "poiName=Madison Square Garden" \
  -F "city=New York"

# Test with coordinates
curl -X POST http://localhost:3000/api/validate \
  -F "text=Great view from here!" \
  -F "locationType=coordinates" \
  -F "lat=40.7505" \
  -F "lng=-73.9934"
```

### 4. Test Edge Cases

**Test 1: Missing text**

```bash
curl -X POST http://localhost:3000/api/validate \
  -F "locationType=poi" \
  -F "poiName=MSG" \
  -F "city=New York"
# Should return: 400 error "Text content is required"
```

**Test 2: Invalid coordinates**

```bash
curl -X POST http://localhost:3000/api/validate \
  -F "text=Test" \
  -F "locationType=coordinates" \
  -F "lat=200" \
  -F "lng=-73.9934"
# Should return: 400 error "Latitude must be between -90 and 90"
```

**Test 3: Future timestamp**

```bash
curl -X POST http://localhost:3000/api/validate \
  -F "text=Test post" \
  -F "locationType=poi" \
  -F "poiName=MSG" \
  -F "city=New York" \
  -F "timestamp=2025-12-31T23:59:59Z"
# Should return: Low time plausibility score
```

## Expected Results

### High Score Example (PASS)

- Text mentions location explicitly
- Location is well-known venue
- Time is plausible for venue type
- No spam indicators

**Expected**: Score ≥ 0.70, Classification: PASS

### Low Score Example (FLAGGED)

- Text doesn't mention location
- No image provided
- Time is implausible
- High spam risk

**Expected**: Score < 0.40, Classification: FLAGGED

## Test Scenarios

### Scenario 1: Strong Match ✅

```
Text: "Amazing concert at Madison Square Garden! #MSG"
Location: POI "Madison Square Garden", City "New York"
Time: 8:30 PM
Expected: High score (0.7-0.9), PASS
```

### Scenario 2: Weak Match ⚠️

```
Text: "Having fun!"
Location: Coordinates (40.7505, -73.9934)
Time: Current time
Expected: Low score (0.3-0.5), LOW_CONFIDENCE or FLAGGED
```

### Scenario 3: Spam Detection 🚫

```
Text: "Great place!" (submitted 5 times at different locations)
Expected: High spam risk, low final score
```

### Scenario 4: Duplicate Image 🚫

```
Same image submitted at different locations
Expected: Image duplicate detected, penalty applied
```
