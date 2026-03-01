# Game Timer System - Complete Redesign

## Current Problems
1. Slow Firestore queries (4-6 seconds)
2. Multiple database round-trips
3. No proper caching strategy
4. Client waiting for server updates
5. Inconsistent timing across phases

## New Architecture

### Core Principle: Pre-computed Game Timeline
Instead of fetching data on-demand, compute the ENTIRE game timeline upfront.

### Server-Side (Cloud Functions)

1. **Game Initialization**
   - Pre-fetch ALL prompts needed for the game (cache 50+ prompts)
   - Create complete game timeline with exact timestamps
   - Store timeline in Realtime Database
   - No more on-demand fetching

2. **Timeline Structure**
```javascript
gameTimeline: {
  rounds: [
    {
      roundNumber: 1,
      prompt: "...",
      phases: {
        prompt: { startTime: 1234567890, duration: 3 },
        submission: { startTime: 1234567893, duration: 25 },
        voting: { startTime: 1234567918, duration: 10 },
        results: { startTime: 1234567928, duration: 8 }
      }
    },
    // ... more rounds pre-computed
  ]
}
```

3. **Single Timer Loop**
   - One scheduled function runs every second
   - Updates current phase based on timeline
   - No setTimeout chains
   - No blocking operations

### Client-Side

1. **Timeline Subscription**
   - Subscribe to game timeline once
   - Calculate current phase and time remaining locally
   - No waiting for server updates

2. **Instant Transitions**
   - Client knows exact transition times
   - Transitions happen on client immediately
   - Server confirms (but client doesn't wait)

3. **Optimistic UI**
   - Show next phase immediately when timer hits 0
   - Server update confirms (usually within 100ms)

## Implementation Plan

### Phase 1: Server Redesign
1. Create new `initializeGameTimeline()` function
2. Pre-fetch all prompts and cache
3. Generate complete timeline
4. Replace all setTimeout with single scheduled function

### Phase 2: Client Redesign
1. Subscribe to timeline instead of individual updates
2. Local timer calculation
3. Optimistic phase transitions
4. Smooth animations

### Phase 3: Optimization
1. Prompt pre-loading on client
2. Image/asset preloading
3. Predictive data fetching

## Expected Performance
- Game start: < 500ms (timeline already computed)
- Phase transitions: 0ms (client-side calculation)
- Server confirmation: ~100-200ms (doesn't block UI)
- Total user-perceived delay: INSTANT
