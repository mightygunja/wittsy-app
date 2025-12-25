/**
 * Events & Tournaments Service
 * Manage events, tournaments, brackets, and leaderboards
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import {
  Event,
  Tournament,
  TournamentMatch,
  TournamentRound,
  EventParticipant,
  TournamentLeaderboard,
  EventStatus,
} from '../types/social';

// ==================== EVENT MANAGEMENT ====================

/**
 * Get all active events
 */
export const getActiveEvents = async (): Promise<Event[]> => {
  // Simplified query - get all events and filter client-side
  const q = query(
    collection(firestore, 'events'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  
  // Filter active events client-side
  return allEvents
    .filter(event => ['upcoming', 'registration', 'active'].includes(event.status))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 20);
};

/**
 * Get featured events
 */
export const getFeaturedEvents = async (): Promise<Event[]> => {
  // Simplified query - get all events and filter client-side
  const q = query(
    collection(firestore, 'events'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  
  // Filter featured events client-side
  return allEvents
    .filter(event => event.featured && ['upcoming', 'registration', 'active'].includes(event.status))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5);
};

/**
 * Get event by ID
 */
export const getEvent = async (eventId: string): Promise<Event | null> => {
  const eventDoc = await getDoc(doc(firestore, 'events', eventId));
  if (!eventDoc.exists()) return null;
  return { id: eventDoc.id, ...eventDoc.data() } as Event;
};

/**
 * Register for event
 */
export const registerForEvent = async (
  eventId: string,
  userId: string,
  username: string,
  avatar: any,
  rating: number
): Promise<void> => {
  const eventDoc = await getDoc(doc(firestore, 'events', eventId));
  if (!eventDoc.exists()) {
    throw new Error('Event not found');
  }

  const event = eventDoc.data() as Event;

  // Check if registration is open
  if (event.status !== 'registration') {
    throw new Error('Registration is not open');
  }

  // Check if event is full
  if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
    throw new Error('Event is full');
  }

  // Check if already registered
  const existingParticipant = await getEventParticipant(eventId, userId);
  if (existingParticipant) {
    throw new Error('Already registered');
  }

  // Check requirements
  if (event.requirements) {
    // Add requirement checks here
  }

  // Create participant entry
  const participantData: EventParticipant = {
    userId,
    username,
    avatar,
    rating,
    registeredAt: new Date().toISOString(),
    checkedIn: false,
  };

  await addDoc(collection(firestore, `events/${eventId}/participants`), participantData);

  // Update event participant count
  await updateDoc(doc(firestore, 'events', eventId), {
    currentParticipants: event.currentParticipants + 1,
  });

  // Create notification
  await createNotification(userId, 'event_registered', {
    title: 'Event Registration Confirmed',
    message: `You're registered for ${event.name}!`,
    eventId,
  });
};

/**
 * Unregister from event
 */
export const unregisterFromEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const q = query(
    collection(firestore, `events/${eventId}/participants`),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error('Not registered for this event');
  }

  const participantDoc = snapshot.docs[0];
  await deleteDoc(participantDoc.ref);

  // Update event participant count
  const eventDoc = await getDoc(doc(firestore, 'events', eventId));
  if (eventDoc.exists()) {
    const event = eventDoc.data() as Event;
    await updateDoc(doc(firestore, 'events', eventId), {
      currentParticipants: Math.max(0, event.currentParticipants - 1),
    });
  }
};

/**
 * Get event participants
 */
export const getEventParticipants = async (eventId: string): Promise<EventParticipant[]> => {
  const snapshot = await getDocs(collection(firestore, `events/${eventId}/participants`));
  return snapshot.docs.map(doc => doc.data() as EventParticipant);
};

/**
 * Get event participant
 */
const getEventParticipant = async (
  eventId: string,
  userId: string
): Promise<EventParticipant | null> => {
  const q = query(
    collection(firestore, `events/${eventId}/participants`),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as EventParticipant;
};

// ==================== TOURNAMENT MANAGEMENT ====================

/**
 * Get tournament details
 */
export const getTournament = async (tournamentId: string): Promise<Tournament | null> => {
  const tournamentDoc = await getDoc(doc(firestore, 'tournaments', tournamentId));
  if (!tournamentDoc.exists()) return null;
  return { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament;
};

/**
 * Get tournament bracket
 */
export const getTournamentBracket = async (tournamentId: string): Promise<TournamentRound[]> => {
  const q = query(
    collection(firestore, `tournaments/${tournamentId}/rounds`),
    orderBy('roundNumber', 'asc')
  );

  const snapshot = await getDocs(q);
  const rounds: TournamentRound[] = [];

  for (const roundDoc of snapshot.docs) {
    const roundData = roundDoc.data();
    const matchesSnapshot = await getDocs(
      collection(firestore, `tournaments/${tournamentId}/rounds/${roundDoc.id}/matches`)
    );
    
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as TournamentMatch));

    rounds.push({
      roundNumber: roundData.roundNumber,
      name: roundData.name,
      matches,
      startTime: roundData.startTime,
      endTime: roundData.endTime,
      status: roundData.status,
    });
  }

  return rounds;
};

/**
 * Get tournament leaderboard
 */
export const getTournamentLeaderboard = async (
  tournamentId: string
): Promise<TournamentLeaderboard[]> => {
  const q = query(
    collection(firestore, `tournaments/${tournamentId}/leaderboard`),
    orderBy('points', 'desc'),
    limit(100)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, index) => ({
    position: index + 1,
    ...doc.data(),
  } as TournamentLeaderboard));
};

/**
 * Report tournament match result
 */
export const reportMatchResult = async (
  tournamentId: string,
  matchId: string,
  winnerId: string,
  player1Score: number,
  player2Score: number
): Promise<void> => {
  // Find the match
  const rounds = await getTournamentBracket(tournamentId);
  let matchFound = false;
  let roundId = '';

  for (const round of rounds) {
    const match = round.matches.find(m => m.id === matchId);
    if (match) {
      matchFound = true;
      roundId = `round_${round.roundNumber}`;
      break;
    }
  }

  if (!matchFound) {
    throw new Error('Match not found');
  }

  // Update match result
  const matchRef = doc(
    firestore,
    `tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}`
  );

  await updateDoc(matchRef, {
    winnerId,
    player1Score,
    player2Score,
    status: 'completed',
  });

  // Update leaderboard
  await updateTournamentLeaderboard(tournamentId, winnerId, player1Score, player2Score);

  // Advance winner to next round if applicable
  await advanceWinnerToNextRound(tournamentId, matchId, winnerId);
};

/**
 * Update tournament leaderboard
 */
const updateTournamentLeaderboard = async (
  tournamentId: string,
  winnerId: string,
  player1Score: number,
  player2Score: number
): Promise<void> => {
  const leaderboardRef = collection(firestore, `tournaments/${tournamentId}/leaderboard`);
  const q = query(leaderboardRef, where('userId', '==', winnerId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new leaderboard entry
    await addDoc(leaderboardRef, {
      userId: winnerId,
      wins: 1,
      losses: 0,
      points: player1Score,
      matchesPlayed: 1,
    });
  } else {
    // Update existing entry
    const doc = snapshot.docs[0];
    const data = doc.data();
    await updateDoc(doc.ref, {
      wins: data.wins + 1,
      points: data.points + player1Score,
      matchesPlayed: data.matchesPlayed + 1,
    });
  }
};

/**
 * Advance winner to next round
 */
const advanceWinnerToNextRound = async (
  tournamentId: string,
  matchId: string,
  winnerId: string
): Promise<void> => {
  // Implementation depends on tournament format
  // For single elimination: advance to next bracket position
  // For round robin: no advancement needed
  // This is a simplified placeholder
  console.log(`Advancing ${winnerId} from match ${matchId} in tournament ${tournamentId}`);
};

// ==================== BRACKET GENERATION ====================

/**
 * Generate single elimination bracket
 */
export const generateSingleEliminationBracket = async (
  tournamentId: string,
  participants: EventParticipant[]
): Promise<void> => {
  const numParticipants = participants.length;
  const numRounds = Math.ceil(Math.log2(numParticipants));
  
  // Shuffle and seed participants
  const seededParticipants = [...participants].sort((a, b) => b.rating - a.rating);
  
  // Generate first round matches
  const firstRoundMatches: TournamentMatch[] = [];
  for (let i = 0; i < numParticipants; i += 2) {
    if (i + 1 < numParticipants) {
      firstRoundMatches.push({
        id: `match_${i / 2}`,
        roundNumber: 1,
        matchNumber: i / 2,
        player1Id: seededParticipants[i].userId,
        player2Id: seededParticipants[i + 1].userId,
        status: 'pending',
      });
    } else {
      // Bye for odd number of participants
      firstRoundMatches.push({
        id: `match_${i / 2}`,
        roundNumber: 1,
        matchNumber: i / 2,
        player1Id: seededParticipants[i].userId,
        winnerId: seededParticipants[i].userId, // Auto-advance
        status: 'completed',
      });
    }
  }

  // Create first round
  const firstRound: TournamentRound = {
    roundNumber: 1,
    name: 'Round 1',
    matches: firstRoundMatches,
    startTime: new Date().toISOString(),
    status: 'pending',
  };

  // Save first round
  const roundRef = await addDoc(
    collection(firestore, `tournaments/${tournamentId}/rounds`),
    {
      roundNumber: 1,
      name: 'Round 1',
      startTime: new Date().toISOString(),
      status: 'pending',
    }
  );

  // Save matches
  for (const match of firstRoundMatches) {
    await addDoc(
      collection(firestore, `tournaments/${tournamentId}/rounds/${roundRef.id}/matches`),
      match
    );
  }

  // Generate placeholder rounds for subsequent rounds
  for (let round = 2; round <= numRounds; round++) {
    const roundName = round === numRounds ? 'Finals' : `Round ${round}`;
    await addDoc(
      collection(firestore, `tournaments/${tournamentId}/rounds`),
      {
        roundNumber: round,
        name: roundName,
        status: 'pending',
      }
    );
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Create notification
 */
const createNotification = async (
  userId: string,
  type: string,
  data: any
): Promise<void> => {
  await addDoc(collection(firestore, 'notifications'), {
    userId,
    type,
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  });
};

/**
 * Check if user meets event requirements
 */
export const checkEventRequirements = async (
  userId: string,
  event: Event
): Promise<{ eligible: boolean; reasons: string[] }> => {
  const reasons: string[] = [];
  
  if (!event.requirements) {
    return { eligible: true, reasons: [] };
  }

  const userDoc = await getDoc(doc(firestore, 'users', userId));
  if (!userDoc.exists()) {
    return { eligible: false, reasons: ['User not found'] };
  }

  const userData = userDoc.data();
  const requirements = event.requirements;

  if (requirements.minLevel && userData.level < requirements.minLevel) {
    reasons.push(`Minimum level ${requirements.minLevel} required`);
  }

  if (requirements.minRating && userData.rating < requirements.minRating) {
    reasons.push(`Minimum rating ${requirements.minRating} required`);
  }

  if (requirements.minGamesPlayed && userData.stats.gamesPlayed < requirements.minGamesPlayed) {
    reasons.push(`Minimum ${requirements.minGamesPlayed} games played required`);
  }

  if (requirements.requiredBadge && !userData.badges?.includes(requirements.requiredBadge)) {
    reasons.push(`Required badge: ${requirements.requiredBadge}`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
};
