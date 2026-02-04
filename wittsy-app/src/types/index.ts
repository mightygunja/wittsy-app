// User Types
export interface User {
  uid: string;
  username: string;
  email: string;
  avatar: Avatar;
  stats: UserStats;
  rating: number;
  rank: string;
  tier?: string;
  level: number;
  xp: number;
  achievements: string[];
  selectedTitle?: string;
  unlockedTitles?: string[];
  badges?: string[];
  region?: string;
  settings: UserSettings;
  friends: string[];
  createdAt: string;
  lastActive: string;
}

// Game Phase Types
export type GamePhase = 'prompt' | 'submission' | 'waiting' | 'voting' | 'results';

// UserProfile is an alias for User, used in contexts where we explicitly reference the full profile
export interface UserProfile extends Omit<User, 'createdAt' | 'lastActive'> {
  createdAt: Date;
  lastActive: Date;
  coins?: number; // User's coin balance for purchases
  gameplayTutorialCompleted?: boolean;
  gameplayTutorialSkipped?: boolean;
  gameplayTutorialCompletedAt?: string;
}

export interface Avatar {
  faceShape: string;
  skinTone: string;
  hairstyle: string;
  hairColor: string;
  eyes: string;
  mouth: string;
  accessories: string[];
  background: string;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  roundsWon: number;
  starsEarned: number;
  totalVotes: number;
  averageVotes: number;
  votingAccuracy: number;
  submissionRate: number;
  // Advanced Stats
  currentStreak: number;
  bestStreak: number;
  longestPhraseLength: number;
  shortestWinningPhraseLength: number;
  comebackWins: number;
  closeCallWins: number;
  unanimousVotes: number;
  perfectGames: number;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'auto';
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  notificationsEnabled: boolean;
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
  colorBlindMode?: boolean;
  reducedAnimations?: boolean;
  autoSubmit?: boolean;
  showVoteCounts?: boolean;
  hapticFeedback?: boolean;
}

// Room Types
export interface Room {
  roomId: string;
  name: string;
  hostId: string;
  status: 'waiting' | 'active' | 'finished';
  settings: RoomSettings;
  players: Player[];
  spectators: string[];
  currentRound: number;
  currentPrompt: Prompt | null;
  scores: { [userId: string]: PlayerScore };
  gameState: 'lobby' | 'submission' | 'voting' | 'results';
  createdAt: string;
  startedAt?: string;
  isRanked: boolean;
  seasonId?: string | null;
  seasonNumber?: number | null;
  seasonName?: string | null;
  countdownStartedAt?: string;
  countdownDuration?: number;
}

export interface RoomSettings {
  maxPlayers: number; // Max 12 for ranked
  minPlayers: number; // Min 3 for ranked
  submissionTime: number;
  votingTime: number;
  winningVotes: number; // Changed from winningScore - total votes needed to win (fixed at 20)
  promptPacks: string[];
  isPrivate: boolean;
  password?: string;
  profanityFilter: 'off' | 'medium' | 'strict';
  spectatorChatEnabled: boolean;
  allowJoinMidGame: boolean;
  joinLockVoteThreshold: number; // New - lock joins when any player reaches this (8 votes)
  autoStart: boolean; // Auto-start for ranked, manual for casual
  countdownTriggerPlayers: number; // Start countdown when this many players join (6 for ranked)
}

export interface Player {
  userId: string;
  username: string;
  avatar: Avatar;
  avatarConfig?: import('./avatar').AvatarConfig; // User's custom avatar configuration
  isReady: boolean;
  isConnected: boolean;
  joinedAt: string;
}

export interface PlayerScore {
  totalVotes: number; // Primary win condition - total votes across all rounds
  roundWins: number; // Kept for stats but not used for winning
  stars: number;
  phrases: Phrase[];
}

// Game Types
export interface Prompt {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pack: string;
}

export interface Phrase {
  id: string;
  userId: string;
  text: string;
  promptId: string;
  votes: number;
  voters: string[];
  isStar: boolean;
  submittedAt: string;
}

export interface Vote {
  voterId: string;
  phraseId: string;
  roundNumber: number;
  votedAt: string;
}

export interface RoundResult {
  roundNumber: number;
  prompt: Prompt;
  phrases: Phrase[];
  winner: {
    userId: string;
    username: string;
    phrase: string;
    votes: number;
  };
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  BrowseRooms: undefined;
  CreateRoom: undefined;
  GameRoom: { roomId: string };
  Lobby: { roomId: string };
  Profile: { userId?: string };
  Leaderboard: undefined;
  Settings: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
};

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'starter' | 'skill' | 'social' | 'milestone';
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
  reward?: AchievementReward;
}

export interface AchievementReward {
  coins?: number;
  avatarItem?: string;
  title?: string;
  badge?: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: Avatar;
  rating: number;
  rank: string;
  wins: number;
  stars: number;
  winRate: number;
  position: number;
}

export type LeaderboardType = 'global' | 'regional' | 'friends' | 'weekly';

// Chat Types
export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  message: string;
  type: 'text' | 'system' | 'emoji';
  timestamp: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'friend_request' | 'game_invite' | 'achievement' | 'game_start';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}
