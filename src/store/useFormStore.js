import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFormStore = create(
  persist(
    (set) => ({
      // Step 2: Basic Registration Data
      basicInfo: {
        referralCodeUsed: '',
        referralFirstName: '', // Auto-filled if code is used
        referralLastName: '',  // Auto-filled if code is used
        password: '',
        profilePhotoUrl: '',
        firstName: '',
        middleName: '',
        lastName: '',
        dob: '',
        gender: '',
        whatsappNumber: '',
        emergencyContact: '',
        emergencyContactName: '',
        bloodGroup: '',
        parentName: '',
        email: '',
        whatsapp: '+91',
        jerseySize: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        stateCode: '',
        country: '',
        zipCode: '',
        aadharUrl: '',
        instagramLink: '',
        instagramApproved: false,
        acceptedTerms: false,
        giclId: '', // Auto-generated
        manualIdCardUrl: '', // Admin uploaded ID card
      },
      updateBasicInfo: (data) => set((state) => ({ basicInfo: { ...state.basicInfo, ...data } })),

      // Step 4: Player Profile
      playerProfile: {
        height: '',
        weight: '',
        age: '', // Auto-calculated
        addressProofDoc: '',
        birthCertificateDoc: '',
        instagramLink: '',
        ballsSelected: [], // Red, White, Pink, Tennis, None
        battingStyle: '', // RHB, LHB, None
        bowlingStyle: '', // Right-Arm Fast, etc.
        fieldPositions: [], // Selected field positions
        cricketHistory: [{ level: 'International', matches: 0 }, { level: 'National', matches: 0 }, { level: 'State', matches: 0 }, { level: 'District', matches: 0 }, { level: 'Taluka', matches: 0 }],
        clubAssociated: 'no',
        clubsDetails: [], // Array of { name: 'Club 1', allowedOutside: 'yes' }
      },
      updatePlayerProfile: (data) => set((state) => ({ playerProfile: { ...state.playerProfile, ...data } })),

      // Step 5: Media & Tutorials
      media: {
        gameplayLinks: {
          batting: [],
          bowling: [],
          fielding: [],
          wk: []
        },
        instagramMediaApproved: false,
        galleryUrls: [],
      },
      updateMedia: (data) => set((state) => ({ media: { ...state.media, ...data } })),

      // Dashboard State
      dashboardState: {
        isDashboardUnlocked: false, // Locked to tutorials initially
        profilePhotoUrl: '',
        referralBalance: 0, // INR balance
        myReferralCode: 'GICL-' + Math.floor(1000 + Math.random() * 9000),
        referrals: [], // { name, status, amountEarned }
        upcomingMatches: []
      },
      updateDashboard: (data) => set((state) => ({ dashboardState: { ...state.dashboardState, ...data } })),
      unlockDashboard: () => set((state) => ({ dashboardState: { ...state.dashboardState, isDashboardUnlocked: true } })),
      simulateFriendRegistration: () => set((state) => {
        const referralCount = state.dashboardState.referrals.length;
        let amountEarned = 0;
        if (referralCount === 0) amountEarned = 50;
        else if (referralCount === 1) amountEarned = 20;
        else amountEarned = 10;

        const newReferral = { name: `Player ${referralCount + 1}`, status: 'Completed', amountEarned };
        return {
          dashboardState: {
            ...state.dashboardState,
            referralBalance: state.dashboardState.referralBalance + amountEarned,
            referrals: [...state.dashboardState.referrals, newReferral]
          }
        };
      }),

      // Global actions
      resetForm: () => set({
        basicInfo: {
          referralCodeUsed: '',
          referralPhone: '',
          referralFirstName: '',
          referralLastName: '',
          firstName: '',
          lastName: '',
          dob: '',
          email: '',
          whatsapp: '+91',
          jerseySize: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          country: '',
          zipCode: '',
          instagramLink: '',
          instagramApproved: false,
          acceptedTerms: false,
          gender: '',
          whatsappNumber: '',
          emergencyContact: '',
          bloodGroup: '',
          parentName: '',
          giclId: '',
          profilePhotoUrl: '',
          password: '',
        },
        playerProfile: {
          height: '', weight: '', age: '', addressProofDoc: '', birthCertificateDoc: '', instagramLink: '', ballsSelected: [], battingStyle: '', bowlingStyle: '', fieldPositions: [], cricketHistory: [{ level: 'International', matches: 0 }, { level: 'National', matches: 0 }, { level: 'State', matches: 0 }, { level: 'District', matches: 0 }, { level: 'Taluka', matches: 0 }], clubAssociated: 'no', clubsDetails: []
        },
        media: { videoLink: '', instagramMediaApproved: false, galleryUrls: [] }
      })
    }),
    {
      name: 'gicl-registration-storage',
      version: 6, // Incremented to clear old cached defaults
    }
  )
);
