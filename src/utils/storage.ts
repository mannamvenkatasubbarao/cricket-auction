import localforage from 'localforage';
import type { StateStorage } from 'zustand/middleware';

localforage.config({
  name: 'CricketAuctionDB',
  version: 1.0,
  storeName: 'auction_store', 
  description: 'Stores data for the Cricket Auction Web App'
});

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await localforage.getItem(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};
