import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '../utils/uuid';

export interface ActivityItem {
  id: string;
  type: 'host_view' | 'host_edit' | 'host_create' | 'page_visit' | 'search';
  title: string;
  subtitle?: string;
  url: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ActivityState {
  recentActivity: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  clearActivity: () => void;
  getActivityByType: (type: ActivityItem['type']) => ActivityItem[];
  getRecentHosts: () => ActivityItem[];
  getRecentSearches: () => ActivityItem[];
}

const MAX_ACTIVITY_ITEMS = 50;
const MAX_RECENT_HOSTS = 10;
const MAX_RECENT_SEARCHES = 5;

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      recentActivity: [],

      addActivity: (activity) => {
        const newActivity: ActivityItem = {
          ...activity,
          id: generateUUID(),
          timestamp: new Date().toISOString(),
        };

        set((state) => {
          // Remove duplicate activities (same type and url)
          const filteredActivity = state.recentActivity.filter(
            (item) => !(item.type === newActivity.type && item.url === newActivity.url)
          );

          // Add new activity at the beginning
          const updatedActivity = [newActivity, ...filteredActivity];

          // Keep only the most recent items
          return {
            recentActivity: updatedActivity.slice(0, MAX_ACTIVITY_ITEMS),
          };
        });
      },

      clearActivity: () => {
        set({ recentActivity: [] });
      },

      getActivityByType: (type) => {
        return get().recentActivity.filter((item) => item.type === type);
      },

      getRecentHosts: () => {
        const hostActivities = get().recentActivity.filter(
          (item) => item.type === 'host_view' || item.type === 'host_edit'
        );
        return hostActivities.slice(0, MAX_RECENT_HOSTS);
      },

      getRecentSearches: () => {
        const searchActivities = get().recentActivity.filter(
          (item) => item.type === 'search'
        );
        return searchActivities.slice(0, MAX_RECENT_SEARCHES);
      },
    }),
    {
      name: 'foreman-activity-storage',
      partialize: (state) => ({
        recentActivity: state.recentActivity,
      }),
    }
  )
);

