import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../utils/storage';
import type { Team, Player, AuctionHistoryItem, AuctionState } from '../types';

interface StoreState extends AuctionState {
  // Actions
  addTeam: (team: Team) => void;
  updateTeam: (id: string, updated: Partial<Team>) => void;
  deleteTeam: (id: string) => void;

  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updated: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  importPlayers: (players: Player[]) => void;

  setAuctionPlayer: (playerId: string | null) => void;
  placeBid: (teamId: string, amount: number) => void;
  undoBid: () => void;
  sellPlayer: () => void;
  markUnsold: () => void;
  undoLastSale: () => void;
  
  pauseAuction: () => void;
  resumeAuction: () => void;
  resetAuction: () => void;
  importBackup: (state: AuctionState) => void;

  // New Admin Functions
  login: () => void;
  logout: () => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  addRole: (role: string) => void;
  removeRole: (role: string) => void;
}

const initialState: AuctionState = {
  teams: [],
  players: [],
  history: [],
  currentPlayerId: null,
  currentBid: 0,
  biddingTeamId: null,
  isPaused: false,
  categories: ['Overseas', 'Indian', 'Emerging', 'Uncapped', 'Icon Player'],
  roles: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'],
  isAuthenticated: false,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),
      updateTeam: (id, updated) => set((state) => ({
        teams: state.teams.map((t) => t.id === id ? { ...t, ...updated } : t)
      })),
      deleteTeam: (id) => set((state) => ({
        teams: state.teams.filter((t) => t.id !== id)
      })),

      addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
      updatePlayer: (id, updated) => set((state) => ({
        players: state.players.map((p) => p.id === id ? { ...p, ...updated } : p)
      })),
      deletePlayer: (id) => set((state) => ({
        players: state.players.filter((p) => p.id !== id)
      })),
      importPlayers: (newPlayers) => set((state) => ({
        players: [...state.players, ...newPlayers]
      })),

      setAuctionPlayer: (playerId) => set({ currentPlayerId: playerId, currentBid: 0, biddingTeamId: null }),
      
      placeBid: (teamId, amount) => {
        const { currentBid } = get();
        if (amount > currentBid) {
          set({ currentBid: amount, biddingTeamId: teamId });
        }
      },
      
      undoBid: () => {
        // Simple undo logic for bids: reset to base price or previous bid logic could go here
        // For simplicity right now, maybe just reset to 0 and let auctioneer re-enter
        set({ currentBid: 0, biddingTeamId: null });
      },

      sellPlayer: () => {
        const { currentPlayerId, currentBid, biddingTeamId } = get();
        if (!currentPlayerId || !biddingTeamId) return;

        const timestamp = Date.now();
        const historyItem: AuctionHistoryItem = {
          id: crypto.randomUUID(),
          playerId: currentPlayerId,
          teamId: biddingTeamId,
          soldPrice: currentBid,
          action: 'sold',
          timestamp
        };

        set((state) => ({
          players: state.players.map(p => 
            p.id === currentPlayerId 
              ? { ...p, status: 'sold', teamId: biddingTeamId, soldPrice: currentBid } 
              : p
          ),
          teams: state.teams.map(t =>
            t.id === biddingTeamId
              ? { ...t, remainingPurse: t.remainingPurse - currentBid }
              : t
          ),
          history: [...state.history, historyItem],
          currentPlayerId: null,
          currentBid: 0,
          biddingTeamId: null,
        }));
      },

      markUnsold: () => {
        const { currentPlayerId } = get();
        if (!currentPlayerId) return;

        const timestamp = Date.now();
        const historyItem: AuctionHistoryItem = {
          id: crypto.randomUUID(),
          playerId: currentPlayerId,
          action: 'unsold',
          timestamp
        };

        set((state) => ({
          players: state.players.map(p => 
            p.id === currentPlayerId 
              ? { ...p, status: 'unsold' } 
              : p
          ),
          history: [...state.history, historyItem],
          currentPlayerId: null,
          currentBid: 0,
          biddingTeamId: null,
        }));
      },

      undoLastSale: () => {
        const { history, players, teams } = get();
        if (history.length === 0) return;

        const lastAction = history[history.length - 1];
        
        let updatedPlayers = [...players];
        let updatedTeams = [...teams];

        if (lastAction.action === 'sold') {
          // Revert player status
          updatedPlayers = updatedPlayers.map(p => 
            p.id === lastAction.playerId ? { ...p, status: 'available', teamId: undefined, soldPrice: undefined } : p
          );
          // Revert team purse
          if (lastAction.teamId && lastAction.soldPrice) {
             updatedTeams = updatedTeams.map(t => 
                t.id === lastAction.teamId ? { ...t, remainingPurse: t.remainingPurse + lastAction.soldPrice! } : t
             );
          }
        } else if (lastAction.action === 'unsold') {
          updatedPlayers = updatedPlayers.map(p => 
            p.id === lastAction.playerId ? { ...p, status: 'available' } : p
          );
        }

        set({
          players: updatedPlayers,
          teams: updatedTeams,
          history: history.slice(0, -1)
        });
      },

      pauseAuction: () => set({ isPaused: true }),
      resumeAuction: () => set({ isPaused: false }),
      resetAuction: () => set({ ...initialState, isAuthenticated: get().isAuthenticated, categories: get().categories, roles: get().roles, teams: get().teams.map(t => ({...t, remainingPurse: t.initialPurse})), players: get().players.map(p => ({...p, status: 'available', teamId: undefined, soldPrice: undefined})) }),
      importBackup: (newState) => set({ ...newState, isAuthenticated: get().isAuthenticated }),

      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      removeCategory: (category) => set((state) => ({ categories: state.categories.filter(c => c !== category) })),
      addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
      removeRole: (role) => set((state) => ({ roles: state.roles.filter(r => r !== role) })),
    }),
    {
      name: 'auction-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
