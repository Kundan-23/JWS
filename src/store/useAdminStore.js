import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Generate some mock global players
const generateMockGlobalPlayers = () => {
  const players = [];
  const styles = ['Right-hand Bat', 'Left-hand Bat'];
  const bowls = ['Right-arm Fast', 'Right-arm Off Spin', 'Left-arm Orthodox', 'Right-arm Leg Spin', 'None'];
  
  for (let i = 1; i <= 50; i++) {
    players.push({
      id: `PL${1000 + i}`,
      name: `Demo Player ${i}`,
      phone: `9876543${String(i).padStart(3, '0')}`,
      age: Math.floor(Math.random() * 30) + 12,
      battingStyle: styles[Math.floor(Math.random() * styles.length)],
      bowlingStyle: bowls[Math.floor(Math.random() * bowls.length)],
      matchesPlayed: Math.floor(Math.random() * 50),
      status: i % 10 === 0 ? 'Disabled' : 'Active', // Some disabled
      coachId: i <= 15 ? 'C1001' : null, // 15 players assigned to coach 1001
      referralsCount: Math.floor(Math.random() * 5),
    });
  }
  return players;
};

const generateMockCoaches = () => {
  return [
    { id: 'C1001', name: 'Ravi Shastri', phone: '9998887771', experience: '15 Years', location: 'Mumbai', status: 'Active', maxSquadSize: 20 },
    { id: 'C1002', name: 'Rahul Dravid', phone: '9998887772', experience: '10 Years', location: 'Bangalore', status: 'Active', maxSquadSize: 20 },
    { id: 'C1003', name: 'Gary Kirsten', phone: '9998887773', experience: '20 Years', location: 'Delhi', status: 'Active', maxSquadSize: 20 }
  ];
};

export const useAdminStore = create(
  persist(
    (set) => ({
      players: generateMockGlobalPlayers(),
      coaches: generateMockCoaches(),

      importPlayers: (importedData) => set((state) => {
        const newPlayers = importedData.map((p, idx) => ({
          ...p,
          id: p.id || `PL${Date.now() + idx}`,
          status: p.status || 'Active',
          referralsCount: p.referralsCount || 0
        }));
        return { players: [...state.players, ...newPlayers] };
      }),

      importCoaches: (importedData) => set((state) => {
        const newCoaches = importedData.map((c, idx) => ({
          ...c,
          id: c.id || `C${Date.now() + idx}`,
          status: c.status || 'Active',
          location: c.location || 'Unknown',
          maxSquadSize: c.maxSquadSize || 20
        }));
        return { coaches: [...state.coaches, ...newCoaches] };
      }),

      togglePlayerStatus: (playerId, disableReason = '') => set((state) => ({
        players: state.players.map(p => 
          p.id === playerId 
            ? { ...p, status: p.status === 'Active' ? 'Disabled' : 'Active', disableReason: p.status === 'Active' ? disableReason : '' } 
            : p
        )
      })),

      assignCoachToPlayer: (playerId, coachId) => set((state) => ({
        players: state.players.map(p => 
          p.id === playerId ? { ...p, coachId } : p
        )
      })),

      updateCoachMaxSquadSize: (coachId, newSize) => set((state) => ({
        coaches: state.coaches.map(c =>
          c.id === coachId ? { ...c, maxSquadSize: parseInt(newSize, 10) } : c
        )
      })),
    }),
    {
      name: 'gicl-admin-data-storage',
      version: 1,
    }
  )
);
