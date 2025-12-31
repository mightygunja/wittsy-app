/**
 * Social & Community Types
 * Friends, Chat, Challenges, Events, Tournaments
 */

// ==================== FRIENDS SYSTEM ====================

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: any;
  toUserId: string;
  toUsername: string;
  status: FriendRequestStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface Friend {
  userId: string;
  username: string;
  avatar?: any;
  rating: number;
  rank: string;
  isOnline: boolean;
  lastActive: string;
  addedAt: string;
  gamesPlayedTogether: number;
  favorited?: boolean;
}

export interface FriendInvite {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  roomId: string;
  roomName: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

// ==================== CHAT SYSTEM ====================

export type MessageType = 'text' | 'emote' | 'reaction' | 'system' | 'sticker';

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  avatar?: any;
  type: MessageType;
  content: string;
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
  replyTo?: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> userIds
}

export interface QuickChatOption {
  id: string;
  text: string;
  emoji: string;
  category: 'greeting' | 'reaction' | 'strategy' | 'emotion';
  cooldown?: number;
}

export interface Emote {
  id: string;
  name: string;
  emoji: string;
  animated?: boolean;
  premium?: boolean;
  unlockCondition?: string;
}

export interface Reaction {
  emoji: string;
  name: string;
  animated?: boolean;
}

// ==================== CHALLENGES SYSTEM ====================

export type ChallengeType = 'daily' | 'weekly' | 'special' | 'seasonal';
export type ChallengeCategory = 'wins' | 'votes' | 'creativity' | 'social' | 'skill';

export interface Challenge {
  id: string;
  type: ChallengeType;
  category: ChallengeCategory;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  progress?: number;
  reward: ChallengeReward;
  startDate: string;
  endDate: string;
  completed?: boolean;
  completedAt?: string;
  claimed?: boolean;
}

export interface ChallengeReward {
  xp?: number;
  coins?: number;
  items?: string[];
  title?: string;
  badge?: string;
  emote?: string;
}

export interface UserChallengeProgress {
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
  claimed: boolean;
  claimedAt?: string;
}

// ==================== EVENTS & TOURNAMENTS ====================

export type EventType = 'tournament' | 'special' | 'seasonal' | 'community';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
export type EventStatus = 'upcoming' | 'registration' | 'active' | 'completed' | 'cancelled';

export interface Event {
  id: string;
  type: EventType;
  name: string;
  description: string;
  banner?: string;
  icon: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  registrationStart?: string;
  registrationEnd?: string;
  maxParticipants?: number;
  currentParticipants: number;
  entryFee?: number;
  prizes: EventPrize[];
  rules?: string[];
  requirements?: EventRequirement;
  featured?: boolean;
}

export interface Tournament extends Event {
  format: TournamentFormat;
  rounds: TournamentRound[];
  currentRound: number;
  bracket?: TournamentBracket;
  leaderboard?: TournamentLeaderboard[];
}

export interface TournamentRound {
  roundNumber: number;
  name: string;
  matches: TournamentMatch[];
  startTime: string;
  endTime?: string;
  status: 'pending' | 'active' | 'completed';
}

export interface TournamentMatch {
  id: string;
  roundNumber: number;
  matchNumber: number;
  player1Id?: string;
  player2Id?: string;
  player1Score?: number;
  player2Score?: number;
  winnerId?: string;
  roomId?: string;
  status: 'pending' | 'active' | 'completed';
  scheduledTime?: string;
}

export interface TournamentBracket {
  rounds: TournamentRound[];
  advancementRules: string;
}

export interface TournamentLeaderboard {
  position: number;
  userId: string;
  username: string;
  avatar?: any;
  wins: number;
  losses: number;
  points: number;
  matchesPlayed: number;
}

export interface EventPrize {
  position: number;
  positionRange?: string; // e.g., "1st", "2nd-3rd", "Top 10"
  xp?: number;
  coins?: number;
  items?: string[];
  title?: string;
  badge?: string;
  exclusive?: boolean;
}

export interface EventRequirement {
  minLevel?: number;
  minRating?: number;
  minGamesPlayed?: number;
  requiredBadge?: string;
  regionRestriction?: string[];
}

export interface EventParticipant {
  userId: string;
  username: string;
  avatar?: any;
  rating: number;
  registeredAt: string;
  checkedIn?: boolean;
  eliminated?: boolean;
  placement?: number;
}

// ==================== USER-GENERATED CONTENT ====================

export type ContentType = 'prompt' | 'pack' | 'challenge' | 'tournament';
export type ContentStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'published';

export interface UserContent {
  id: string;
  type: ContentType;
  creatorId: string;
  creatorUsername: string;
  title: string;
  description: string;
  content: any; // Type-specific content
  status: ContentStatus;
  createdAt: string;
  publishedAt?: string;
  views: number;
  likes: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  featured?: boolean;
  tags?: string[];
  reviewNotes?: string;
}

// ==================== SOCIAL STATS ====================

export interface SocialStats {
  friendsCount: number;
  pendingRequestsCount: number;
  messagesCount: number;
  challengesCompleted: number;
  eventsParticipated: number;
  tournamentsWon: number;
  contentCreated: number;
  contentLikes: number;
}

// ==================== NOTIFICATIONS ====================

export type NotificationType = 
  | 'friend_request'
  | 'friend_accepted'
  | 'friend_online'
  | 'game_invite'
  | 'chat_message'
  | 'challenge_completed'
  | 'challenge_new'
  | 'event_starting'
  | 'event_registered'
  | 'tournament_match'
  | 'content_approved'
  | 'content_featured';

export interface SocialNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  expiresAt?: string;
}
