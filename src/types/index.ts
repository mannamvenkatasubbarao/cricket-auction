export type Role = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper' | string;
export type Category = 'Overseas' | 'Emerging' | 'Uncapped' | 'Icon Player' | string;

export const MAX_PLAYERS_PER_TEAM = 13;

export interface Team {
  id: string;
  name: string;
  logo?: string; // Base64
  color: string;
  initialPurse: number;
  remainingPurse: number;
}

export interface Player {
  id: string;
  name: string;
  photo?: string; // Base64
  country: string;
  countryFlag?: string; // Base64 or emoji
  role: Role;
  category: Category;
  basePrice: number;
  notes?: string;
  status: 'available' | 'sold' | 'unsold';
  teamId?: string; // If sold
  soldPrice?: number;
}

export interface AuctionHistoryItem {
  id: string;
  playerId: string;
  teamId?: string;
  soldPrice?: number;
  action: 'sold' | 'unsold';
  timestamp: number;
}

export interface AuctionState {
  teams: Team[];
  players: Player[];
  history: AuctionHistoryItem[];
  currentPlayerId: string | null;
  currentBid: number;
  biddingTeamId: string | null;
  isPaused: boolean;
  categories: Category[];
  roles: Role[];
  isAuthenticated: boolean;
}
