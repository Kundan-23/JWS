import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { coachAPI } from '../services/api';

// ─── useCoachStore — backed by real API calls ──────────────────────────────
export const useCoachStore = create(
  persist(
    (set, get) => ({
      // ── Profile ──────────────────────────────────────────────────────────
      profile: null,
      profileLoading: false,

      fetchProfile: async () => {
        set({ profileLoading: true });
        try {
          const res = await coachAPI.getProfile();
          set({ profile: res.data?.coach || null });
        } catch (e) {
          console.error('fetchProfile error', e);
        } finally {
          set({ profileLoading: false });
        }
      },

      // ── Squad ─────────────────────────────────────────────────────────────
      allocatedPlayers: [],
      playersLoading: false,

      fetchPlayers: async () => {
        set({ playersLoading: true });
        try {
          const res = await coachAPI.getPlayers();
          set({ allocatedPlayers: res.data?.players || [] });
        } catch (e) {
          console.error('fetchPlayers error', e);
        } finally {
          set({ playersLoading: false });
        }
      },

      // ── Videos (Scrutiny) ────────────────────────────────────────────────
      videos: [],
      videosLoading: false,

      fetchVideos: async () => {
        set({ videosLoading: true });
        try {
          const res = await coachAPI.getVideos();
          set({ videos: res.data?.videos || [] });
        } catch (e) {
          console.error('fetchVideos error', e);
        } finally {
          set({ videosLoading: false });
        }
      },

      submitVideoReview: async (videoId, flag, comment) => {
        await coachAPI.reviewVideo(videoId, { flag, comment });
        // Refresh videos after review
        get().fetchVideos();
      },

      // ── My Uploads ───────────────────────────────────────────────────────
      myUploads: [],
      uploadsLoading: false,

      fetchMyUploads: async () => {
        set({ uploadsLoading: true });
        try {
          const res = await coachAPI.getMyUploads();
          set({ myUploads: res.data?.uploads || [] });
        } catch (e) {
          console.error('fetchMyUploads error', e);
        } finally {
          set({ uploadsLoading: false });
        }
      },

      addUpload: async (title, url) => {
        await coachAPI.addUpload({ title, url });
        get().fetchMyUploads();
      },

      // ── Teams (custom squad groups - saved locally & to DB via profile) ──
      teams: [],

      createTeam: (teamName, playerIds) => set(state => {
        const newTeam = { id: `T${Date.now()}`, name: teamName, playerIds };
        return { teams: [...state.teams, newTeam] };
      }),

      deleteTeam: (teamId) => set(state => ({
        teams: state.teams.filter(t => t.id !== teamId),
      })),

      // ── Matches ───────────────────────────────────────────────────────────
      matches: [],
      matchesLoading: false,

      fetchMatches: async () => {
        set({ matchesLoading: true });
        try {
          const res = await coachAPI.getMatches();
          set({ matches: res.data?.matches || [] });
        } catch (e) {
          console.error('fetchMatches error', e);
        } finally {
          set({ matchesLoading: false });
        }
      },

      // ── Referrals ─────────────────────────────────────────────────────────
      referralCode: null,
      referralPoints: 0,

      fetchReferrals: async () => {
        try {
          const res = await coachAPI.getReferrals();
          set({ referralCode: res.data?.referralCode, referralPoints: res.data?.referralPoints || 0 });
        } catch (e) {
          console.error('fetchReferrals error', e);
        }
      },

      // ── Reset (on logout) ─────────────────────────────────────────────────
      resetCoach: () => set({
        profile: null,
        allocatedPlayers: [],
        videos: [],
        myUploads: [],
        matches: [],
        teams: [],
        referralCode: null,
        referralPoints: 0,
      }),
    }),
    {
      name: 'gicl-coach-storage',
      version: 4, // bumped to clear old mock data
      partialize: (state) => ({ teams: state.teams }), // only persist custom teams
    }
  )
);
