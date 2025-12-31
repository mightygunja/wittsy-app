/**
 * Sample Events Data
 * Pre-configured events to populate the events system
 */

import { Event } from '../types/social';

/**
 * Sample events to seed the database
 */
export const SAMPLE_EVENTS: Omit<Event, 'id'>[] = [
  // Featured Weekend Tournament
  {
    type: 'tournament',
    name: 'Weekend Warriors Tournament',
    description: 'Compete in our weekly tournament for exclusive rewards and bragging rights! Single elimination format with live brackets.',
    icon: '🏆',
    status: 'registration',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    registrationStart: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Started yesterday
    registrationEnd: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 days from now
    maxParticipants: 64,
    currentParticipants: 0,
    entryFee: 100,
    prizes: [
      { position: 1, coins: 1000, xp: 500, title: 'Weekend Champion', badge: 'weekend_warrior', exclusive: true },
      { position: 2, coins: 500, xp: 300, badge: 'weekend_warrior' },
      { position: 3, coins: 300, xp: 200 },
      { position: 4, positionRange: '4th', coins: 200, xp: 150 },
      { position: 5, positionRange: '5th-8th', coins: 100, xp: 100 },
    ],
    requirements: {
      minLevel: 5,
      minGamesPlayed: 10,
    },
    featured: true,
  },

  // New Year Special Event
  {
    type: 'special',
    name: 'New Year Celebration',
    description: 'Ring in the new year with double XP and exclusive rewards! Complete special challenges and earn limited-time items.',
    icon: '🎉',
    status: 'active',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Started yesterday
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
    maxParticipants: undefined, // Unlimited
    currentParticipants: 0,
    prizes: [
      { position: 1, positionRange: 'All Participants', coins: 200, xp: 100, badge: 'new_year_2025' },
      { position: 1, positionRange: 'Top 100', coins: 500, xp: 300, title: 'New Year Champion' },
      { position: 1, positionRange: 'Top 10', coins: 1000, xp: 500, title: 'Party Legend', exclusive: true },
    ],
    featured: true,
  },

  // Community Game Night
  {
    type: 'community',
    name: 'Community Game Night',
    description: 'Join us for a casual game night! No entry fee, just fun and friends. Perfect for new players to meet the community.',
    icon: '🎮',
    status: 'registration',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    endDate: new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000).toISOString(), // 3.5 days from now
    registrationStart: new Date().toISOString(),
    registrationEnd: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 100,
    currentParticipants: 0,
    prizes: [
      { position: 1, positionRange: 'All Participants', coins: 50, xp: 50 },
      { position: 1, coins: 200, xp: 100, title: 'Community Star' },
    ],
    featured: false,
  },

  // Monthly Ranked Ladder
  {
    type: 'seasonal',
    name: 'January Ranked Ladder',
    description: 'Climb the ranked ladder this month! Top players earn exclusive rewards and titles. Compete in ranked matches to earn points.',
    icon: '🎯',
    status: 'active',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Started 5 days ago
    endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
    maxParticipants: undefined,
    currentParticipants: 0,
    prizes: [
      { position: 1, coins: 2000, xp: 1000, title: 'Grandmaster', badge: 'grandmaster_jan', exclusive: true },
      { position: 2, coins: 1500, xp: 750, title: 'Master', badge: 'master_jan' },
      { position: 3, coins: 1000, xp: 500, title: 'Diamond', badge: 'diamond_jan' },
      { position: 4, positionRange: '4th-10th', coins: 500, xp: 300, badge: 'platinum_jan' },
      { position: 11, positionRange: '11th-50th', coins: 250, xp: 150 },
    ],
    requirements: {
      minLevel: 10,
      minRating: 1200,
      minGamesPlayed: 25,
    },
    featured: true,
  },

  // Speed Round Challenge
  {
    type: 'special',
    name: 'Speed Round Challenge',
    description: 'Think fast! Complete rounds in under 30 seconds to earn bonus points. Fast-paced action with quick rewards.',
    icon: '⚡',
    status: 'upcoming',
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    registrationStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    registrationEnd: new Date(Date.now() + 4.5 * 24 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 200,
    currentParticipants: 0,
    prizes: [
      { position: 1, coins: 500, xp: 250, title: 'Speed Demon', badge: 'speed_demon' },
      { position: 2, coins: 300, xp: 150 },
      { position: 3, coins: 200, xp: 100 },
      { position: 4, positionRange: '4th-20th', coins: 100, xp: 50 },
    ],
    requirements: {
      minLevel: 3,
    },
    featured: false,
  },

  // Creative Writing Showcase
  {
    type: 'community',
    name: 'Creative Writing Showcase',
    description: 'Show off your wit and creativity! Submit your best responses and let the community vote. Most creative wins!',
    icon: '✍️',
    status: 'registration',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    registrationStart: new Date().toISOString(),
    registrationEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 50,
    currentParticipants: 0,
    prizes: [
      { position: 1, coins: 800, xp: 400, title: 'Master Wordsmith', badge: 'wordsmith_master', exclusive: true },
      { position: 2, coins: 500, xp: 250, title: 'Creative Genius' },
      { position: 3, coins: 300, xp: 150 },
      { position: 4, positionRange: '4th-10th', coins: 150, xp: 75 },
    ],
    featured: false,
  },

  // Beginner's Cup
  {
    type: 'tournament',
    name: "Beginner's Cup",
    description: 'New to Wittsy? This tournament is for you! Compete with other beginners and learn the ropes. No entry fee!',
    icon: '🌟',
    status: 'registration',
    startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    registrationStart: new Date().toISOString(),
    registrationEnd: new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 32,
    currentParticipants: 0,
    prizes: [
      { position: 1, coins: 300, xp: 200, title: 'Rising Star', badge: 'beginner_champion' },
      { position: 2, coins: 200, xp: 150 },
      { position: 3, coins: 150, xp: 100 },
      { position: 4, positionRange: '4th-8th', coins: 100, xp: 75 },
    ],
    requirements: {
      minLevel: 1,
      minGamesPlayed: 5,
    },
    rules: [
      'Must be level 10 or below',
      'Must have played fewer than 50 games',
      'Single elimination format',
      'Best of 3 rounds per match',
    ],
    featured: false,
  },
];

/**
 * Initialize sample events in Firestore
 * Call this once to populate the events collection
 */
export const initializeSampleEvents = async (): Promise<void> => {
  const { addDoc, collection } = await import('firebase/firestore');
  const { firestore } = await import('./firebase');

  console.log('🎪 Initializing sample events...');

  for (const event of SAMPLE_EVENTS) {
    try {
      const docRef = await addDoc(collection(firestore, 'events'), event);
      console.log(`✅ Created event: ${event.name} (${docRef.id})`);
    } catch (error) {
      console.error(`❌ Failed to create event: ${event.name}`, error);
    }
  }

  console.log('🎉 Sample events initialized!');
};
