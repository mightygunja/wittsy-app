/**
 * Prompt System Types
 */

export type PromptCategory = 
  | 'general'
  | 'pop-culture'
  | 'food'
  | 'technology'
  | 'sports'
  | 'movies'
  | 'music'
  | 'travel'
  | 'animals'
  | 'history'
  | 'science'
  | 'relationships'
  | 'work'
  | 'school'
  | 'holidays'
  | 'seasonal'
  | 'trending'
  | 'nsfw';

export type PromptDifficulty = 'easy' | 'medium' | 'hard';

export type PromptStatus = 'active' | 'pending' | 'rejected' | 'flagged';

export interface Prompt {
  id: string;
  text: string;
  category: PromptCategory;
  difficulty: PromptDifficulty;
  tags: string[];
  status: PromptStatus;
  
  // Metadata
  createdAt: string;
  createdBy?: string; // userId for community prompts
  isOfficial: boolean;
  isPremium: boolean;
  
  // Stats
  timesUsed: number;
  averageRating: number;
  reportCount: number;
  
  // Seasonal/Themed
  theme?: string;
  seasonalStart?: string;
  seasonalEnd?: string;
  
  // Moderation
  moderatedBy?: string;
  moderatedAt?: string;
  rejectionReason?: string;
}

export interface PromptPack {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: PromptCategory;
  promptIds: string[];
  
  // Availability
  isPremium: boolean;
  isLimited: boolean;
  availableFrom?: string;
  availableUntil?: string;
  
  // Pricing
  price?: number;
  currency?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  rating: number;
}

export interface PromptSubmission {
  id: string;
  text: string;
  category: PromptCategory;
  suggestedDifficulty: PromptDifficulty;
  tags: string[];
  
  // Submitter info
  submittedBy: string;
  submittedAt: string;
  
  // Review status
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  
  // Community feedback
  upvotes: number;
  downvotes: number;
  reportCount: number;
}

export interface PhraseReport {
  id: string;
  phraseText: string;
  promptId: string;
  roomId: string;
  
  // Reporter info
  reportedBy: string;
  reportedAt: string;
  reason: 'offensive' | 'spam' | 'inappropriate' | 'other';
  details?: string;
  
  // Reported user
  userId: string;
  username: string;
  
  // Review
  status: 'pending' | 'reviewed' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  action?: 'warning' | 'temp-ban' | 'permanent-ban' | 'none';
  reviewNotes?: string;
}

export interface UserPromptPreferences {
  userId: string;
  enabledCategories: PromptCategory[];
  disabledCategories: PromptCategory[];
  difficulty: PromptDifficulty[];
  profanityFilter: boolean;
  nsfwContent: boolean;
  ownedPacks: string[];
  favoritePacks: string[];
}
