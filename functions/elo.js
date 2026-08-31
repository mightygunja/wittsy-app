/**
 * Server-side ELO settlement — faithful port of src/services/eloRatingService.ts.
 *
 * Runs inside endGame (exactly once per game, admin SDK) so ratings can never
 * be multiplied by concurrent clients or spoofed by a modified client. The
 * computed updates are also returned so endGame can stamp them onto the room
 * doc for clients to display.
 */

const admin = require('firebase-admin');

const RATING_CONSTANTS = {
  INITIAL_RATING: 1200,
  K_FACTOR_PLACEMENT: 60,
  K_FACTOR_NEW: 50,
  K_FACTOR_NORMAL: 32,
  K_FACTOR_HIGH: 20,
  K_FACTOR_MASTER: 16,
  PLACEMENT_GAMES: 10,
  PROVISIONAL_GAMES: 30,
  MIN_RATING: 100,
  MAX_RATING: 4000,
  HIGH_RATING_THRESHOLD: 2000,
  MASTER_RATING_THRESHOLD: 2400,
  WIN_STREAK_BONUS: 2,
  MAX_STREAK_BONUS: 10,
  MARGIN_OF_VICTORY_MAX: 5,
  INITIAL_RD: 350,
  MIN_RD: 50,
  MAX_RD: 350,
  RD_DECAY_PER_DAY: 1,
};

const calculateExpectedScore = (ratingA, ratingB) =>
  1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

const getKFactor = (rating, gamesPlayed) => {
  if (gamesPlayed < RATING_CONSTANTS.PLACEMENT_GAMES) return RATING_CONSTANTS.K_FACTOR_PLACEMENT;
  if (gamesPlayed < RATING_CONSTANTS.PROVISIONAL_GAMES) return RATING_CONSTANTS.K_FACTOR_NEW;
  if (rating >= RATING_CONSTANTS.MASTER_RATING_THRESHOLD) return RATING_CONSTANTS.K_FACTOR_MASTER;
  if (rating >= RATING_CONSTANTS.HIGH_RATING_THRESHOLD) return RATING_CONSTANTS.K_FACTOR_HIGH;
  return RATING_CONSTANTS.K_FACTOR_NORMAL;
};

const getStreakBonus = (winStreak) => {
  if (winStreak < 3) return 0;
  return Math.min((winStreak - 2) * RATING_CONSTANTS.WIN_STREAK_BONUS, RATING_CONSTANTS.MAX_STREAK_BONUS);
};

const getMarginOfVictoryBonus = (winnerVotes, secondPlaceVotes, totalVotes) => {
  if (totalVotes === 0) return 0;
  const margin = (winnerVotes - secondPlaceVotes) / totalVotes;
  const bonus = Math.round(margin * RATING_CONSTANTS.MARGIN_OF_VICTORY_MAX);
  return Math.max(0, Math.min(bonus, RATING_CONSTANTS.MARGIN_OF_VICTORY_MAX));
};

const getConfidenceLevel = (ratingDeviation) => {
  if (ratingDeviation >= 250) return 'Uncertain';
  if (ratingDeviation >= 150) return 'Developing';
  if (ratingDeviation >= 100) return 'Moderate';
  return 'Confident';
};

const updateRatingDeviation = (currentRD, lastGameDate) => {
  const daysSinceLastGame = Math.floor(
    (Date.now() - new Date(lastGameDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.min(
    currentRD + (daysSinceLastGame * RATING_CONSTANTS.RD_DECAY_PER_DAY),
    RATING_CONSTANTS.MAX_RD
  );
};

const calculateNewRating = (
  playerRating, opponentRating, playerWon, gamesPlayed,
  winStreak = 0, marginOfVictoryData = undefined, ratingDeviation = RATING_CONSTANTS.INITIAL_RD
) => {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  const actualScore = playerWon ? 1 : 0;
  const kFactor = getKFactor(playerRating, gamesPlayed);

  let ratingChange = kFactor * (actualScore - expectedScore);

  if (playerWon && winStreak >= 3) {
    ratingChange += getStreakBonus(winStreak);
  }

  let marginBonus = 0;
  if (playerWon && marginOfVictoryData) {
    marginBonus = getMarginOfVictoryBonus(
      marginOfVictoryData.winnerVotes,
      marginOfVictoryData.secondPlaceVotes,
      marginOfVictoryData.totalVotes
    );
    ratingChange += marginBonus;
  }

  ratingChange = Math.round(ratingChange);
  let newRating = playerRating + ratingChange;
  newRating = Math.max(RATING_CONSTANTS.MIN_RATING, Math.min(RATING_CONSTANTS.MAX_RATING, newRating));

  return {
    oldRating: playerRating,
    newRating,
    ratingChange,
    expectedScore,
    actualScore,
    kFactor,
    gamesPlayed: gamesPlayed + 1,
    winStreak: playerWon ? winStreak + 1 : 0,
    lossStreak: playerWon ? 0 : winStreak + 1,
    marginBonus: marginBonus > 0 ? marginBonus : null,
    confidenceLevel: getConfidenceLevel(ratingDeviation),
    isPlacement: gamesPlayed < RATING_CONSTANTS.PLACEMENT_GAMES,
  };
};

const readPlayerRatingData = (userData, isRanked) => {
  const rating = isRanked
    ? (userData.rankedRating || userData.rating || RATING_CONSTANTS.INITIAL_RATING)
    : (userData.casualRating || userData.rating || RATING_CONSTANTS.INITIAL_RATING);
  const gamesPlayed = isRanked
    ? (userData.rankedGamesPlayed || 0)
    : (userData.casualGamesPlayed || 0);
  return {
    rating,
    gamesPlayed,
    winStreak: userData.winStreak || 0,
    lossStreak: userData.lossStreak || 0,
    peakRating: userData.peakRating || RATING_CONSTANTS.INITIAL_RATING,
    peakRankedRating: userData.peakRankedRating || RATING_CONSTANTS.INITIAL_RATING,
    ratingDeviation: userData.ratingDeviation || RATING_CONSTANTS.INITIAL_RD,
    lastGameDate: userData.lastGameDate || new Date().toISOString(),
  };
};

/**
 * Settle ratings for a finished game (any player count >= 2).
 * playerScores: [{ userId, score }] sorted descending by score.
 * Returns a map userId -> rating update summary for the room doc.
 */
async function settleRatings(db, playerScores, isRanked) {
  if (playerScores.length < 2) return {};

  const playerIds = playerScores.map(p => p.userId);
  const userSnaps = await db.getAll(...playerIds.map(id => db.collection('users').doc(id)));
  const dataById = {};
  userSnaps.forEach((snap, i) => {
    if (snap.exists) dataById[playerIds[i]] = readPlayerRatingData(snap.data(), isRanked);
  });
  const ratedIds = playerIds.filter(id => dataById[id]);
  if (ratedIds.length < 2) return {};

  const sorted = [...ratedIds]; // playerScores already sorted by score desc
  const scoreOf = Object.fromEntries(playerScores.map(p => [p.userId, p.score]));

  const winnerVotes = scoreOf[sorted[0]] || 0;
  const secondPlaceVotes = scoreOf[sorted[1]] || 0;
  const totalVotes = playerScores.reduce((sum, p) => sum + (p.score || 0), 0);
  const marginOfVictoryData = { winnerVotes, secondPlaceVotes, totalVotes };

  const updates = {};

  if (sorted.length === 2) {
    // 1v1 — direct pairwise, mirrors updatePlayerRating
    const [winnerId, loserId] = sorted;
    const w = dataById[winnerId], l = dataById[loserId];
    const winnerRD = updateRatingDeviation(w.ratingDeviation, w.lastGameDate);
    const loserRD = updateRatingDeviation(l.ratingDeviation, l.lastGameDate);
    updates[winnerId] = calculateNewRating(w.rating, l.rating, true, w.gamesPlayed, w.winStreak, marginOfVictoryData, winnerRD);
    updates[loserId] = calculateNewRating(l.rating, w.rating, false, l.gamesPlayed, l.lossStreak, undefined, loserRD);
    updates[winnerId].rd = Math.max(winnerRD - 10, RATING_CONSTANTS.MIN_RD);
    updates[loserId].rd = Math.max(loserRD - 10, RATING_CONSTANTS.MIN_RD);
  } else {
    // Multiplayer — pairwise accumulation, mirrors updateMultiplayerRatings
    const ratingChanges = Object.fromEntries(sorted.map(id => [id, 0]));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i], b = sorted[j];
        const aData = dataById[a], bData = dataById[b];
        const isWinner = i === 0;
        const updateA = calculateNewRating(aData.rating, bData.rating, true, aData.gamesPlayed, aData.winStreak, isWinner ? marginOfVictoryData : undefined, aData.ratingDeviation);
        const updateB = calculateNewRating(bData.rating, aData.rating, false, bData.gamesPlayed, bData.lossStreak, undefined, bData.ratingDeviation);
        ratingChanges[a] += updateA.ratingChange / (sorted.length - 1);
        ratingChanges[b] += updateB.ratingChange / (sorted.length - 1);
      }
    }
    sorted.forEach((id, idx) => {
      const p = dataById[id];
      const isWinner = idx === 0;
      const ratingChange = Math.round(ratingChanges[id]);
      const newRating = Math.max(RATING_CONSTANTS.MIN_RATING, Math.min(RATING_CONSTANTS.MAX_RATING, p.rating + ratingChange));
      updates[id] = {
        oldRating: p.rating,
        newRating,
        ratingChange,
        expectedScore: 0.5,
        actualScore: isWinner ? 1 : 0,
        kFactor: getKFactor(p.rating, p.gamesPlayed),
        gamesPlayed: p.gamesPlayed + 1,
        winStreak: isWinner ? p.winStreak + 1 : 0,
        lossStreak: isWinner ? 0 : p.lossStreak + 1,
        marginBonus: isWinner ? getMarginOfVictoryBonus(winnerVotes, secondPlaceVotes, totalVotes) || null : null,
        confidenceLevel: getConfidenceLevel(p.ratingDeviation),
        isPlacement: p.gamesPlayed < RATING_CONSTANTS.PLACEMENT_GAMES,
        rd: Math.max(updateRatingDeviation(p.ratingDeviation, p.lastGameDate) - 10, RATING_CONSTANTS.MIN_RD),
      };
    });
  }

  // Apply all user updates + rating history in one batch.
  const batch = db.batch();
  const nowIso = new Date().toISOString();
  sorted.forEach((id, idx) => {
    const u = updates[id];
    const p = dataById[id];
    const isWinner = idx === 0;
    const userUpdates = {
      gamesPlayed: admin.firestore.FieldValue.increment(1),
      winStreak: u.winStreak,
      lossStreak: u.lossStreak,
      peakRating: Math.max(p.peakRating, u.newRating),
      ratingDeviation: u.rd,
      lastGameDate: nowIso,
    };
    if (isRanked) {
      userUpdates.rankedRating = u.newRating;
      userUpdates.rankedGamesPlayed = admin.firestore.FieldValue.increment(1);
      if (isWinner) userUpdates.peakRankedRating = Math.max(p.peakRankedRating || 0, u.newRating);
    } else {
      userUpdates.casualRating = u.newRating;
      userUpdates.casualGamesPlayed = admin.firestore.FieldValue.increment(1);
    }
    if (isWinner) userUpdates.gamesWon = admin.firestore.FieldValue.increment(1);
    else userUpdates.gamesLost = admin.firestore.FieldValue.increment(1);

    batch.update(db.collection('users').doc(id), userUpdates);
    batch.set(db.collection('ratingHistory').doc(), {
      userId: id,
      oldRating: u.oldRating,
      newRating: u.newRating,
      ratingChange: u.ratingChange,
      result: isWinner ? 'win' : 'loss',
      gameType: sorted.length === 2 ? '1v1' : 'multiplayer',
      playerCount: sorted.length,
      finalScore: scoreOf[id] || 0,
      placement: idx + 1,
      isRanked,
      isPlacement: u.isPlacement,
      marginBonus: u.marginBonus,
      confidenceLevel: u.confidenceLevel,
      kFactor: u.kFactor,
      timestamp: nowIso,
    });
  });
  await batch.commit();

  // Strip fields the client display doesn't need before stamping on the room
  const summary = {};
  sorted.forEach((id, idx) => {
    const u = updates[id];
    summary[id] = {
      oldRating: u.oldRating,
      newRating: u.newRating,
      ratingChange: u.ratingChange,
      placement: idx + 1,
      isPlacement: u.isPlacement,
      marginBonus: u.marginBonus,
    };
  });
  return summary;
}

module.exports = { settleRatings, RATING_CONSTANTS };
