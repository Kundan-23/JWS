import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useConfigStore = create(
  persist(
    (set) => ({
      // Categories & Demographics
      ageGroups: [
        { id: 1, cat: 'Juniors', sub: 'Boys U-13', color: '#3b82f6' },
        { id: 2, cat: 'Juniors', sub: 'Boys U-15', color: '#4f46e5' },
        { id: 3, cat: 'Juniors', sub: 'Girls U-17', color: '#ec4899' },
        { id: 4, cat: 'Juniors', sub: 'Boys U-22', color: '#06b6d4' },
        { id: 5, cat: 'Open', sub: 'Men', color: '#10b981' },
        { id: 6, cat: 'Open', sub: 'Women', color: '#14b8a6' },
        { id: 7, cat: 'Masters', sub: '35+', color: '#f97316' },
        { id: 8, cat: 'Masters', sub: '40+', color: '#f59e0b' },
        { id: 9, cat: 'Masters', sub: '45+', color: '#ef4444' },
        { id: 10, cat: 'Masters', sub: '50+', color: '#a855f7' },
        { id: 11, cat: 'Masters', sub: '55+', color: '#d946ef' },
        { id: 12, cat: 'Masters', sub: '60+', color: '#8b5cf6' }
      ],
      jerseySizes: ['Kid-S', 'Kid-M', 'Kid-L', 'S', 'M', 'L', 'XL', 'XXL'],
      battingStyles: ['Right-hand Bat', 'Left-hand Bat'],
      bowlingStyles: ['Right-arm Fast', 'Right-arm Off Spin', 'Left-arm Orthodox', 'Right-arm Leg Spin', 'None'],
      clubs: ['Mumbai Strikers', 'Delhi Capitals Academy', 'Chennai Super Kings Academy', 'Royal Challengers Academy'],
      ballTypes: [
        { id: 'red', name: 'Red Leather', image: '/images/balls/red.png' },
        { id: 'white', name: 'White Leather', image: '/images/balls/white.png' },
        { id: 'pink', name: 'Pink Leather', image: '/images/balls/pink.png' },
        { id: 'tennis', name: 'Tennis Ball', image: '/images/balls/tennis.png' }
      ],
      landingBgImage: '',
      
      // Text & Policies
      registrationTerms: "By completing this registration, you agree to abide by the rules and regulations of JWS Sports...",
      
      // Pricing & Plans
      plans: [
        { 
          id: 'p1', 
          name: 'Basic Pack', 
          price: 299, 
          features: ['2 Matches Guaranteed', 'Standard Jersey', 'Basic Training Videos'], 
          terms: `JWS Membership – Terms & Conditions\n\n1. The JWS Membership is priced at ₹499 and is valid for a limited period as determined by JWS Sports.\n\n2. The membership fee is strictly non-refundable and non-transferable under any circumstances.\n\n3. Registrations are accepted on a first come, first serve basis. JWS reserves the right to close registrations once capacity is reached.\n\n4. This membership includes access to *paid professional training sessions* and *paid official trials*. It also provides eligibility for district and state championships, and franchise leagues. Participation in higher-level competitions is subject to performance, selection criteria, and availability of slots.\n\n5. Selection for trials, district, state, or franchise leagues is not guaranteed and will be based purely on merit, performance, and management discretion.\n\n6. Training schedules, trial dates, match fixtures, venues, and formats are subject to change due to operational requirements, weather conditions, or unforeseen circumstances. Final decisions will rest with JWS management.\n\n7. Players must maintain discipline, fitness, and sportsmanship at all times. Any misconduct or violation of rules may lead to suspension or cancellation of membership without refund.\n\n8. JWS Sports is not responsible for any injuries, accidents, or loss/damage of personal belongings during training sessions, trials, matches, or related activities. Players participate at their own risk.\n\n9. Players must report on time for all training sessions, trials, and matches. Failure to do so may result in exclusion without compensation.\n\n10. JWS reserves the right to modify, update, or revise these terms and conditions at any time without prior notice.\n\n11. By registering for JWS Membership, the player agrees to abide by all the above terms and conditions.\n\n12. Additional 18% GST Applicable.\n\nYou agree to share information entered on this page with JWS Sports (owner of this page) and Razorpay, adhering to applicable laws.`
        },
        { 
          id: 'p2', 
          name: 'Elite Pack', 
          price: 699, 
          features: ['5 Matches Guaranteed', 'Premium Jersey', 'Advance Training Videos', 'One-on-One Coaching Session'], 
          terms: `JWS Membership – Terms & Conditions\n\n1. The JWS Membership is priced at ₹499 and is valid for a limited period as determined by JWS Sports.\n\n2. The membership fee is strictly non-refundable and non-transferable under any circumstances.\n\n3. Registrations are accepted on a first come, first serve basis. JWS reserves the right to close registrations once capacity is reached.\n\n4. This membership includes access to *paid professional training sessions* and *paid official trials*. It also provides eligibility for district and state championships, and franchise leagues. Participation in higher-level competitions is subject to performance, selection criteria, and availability of slots.\n\n5. Selection for trials, district, state, or franchise leagues is not guaranteed and will be based purely on merit, performance, and management discretion.\n\n6. Training schedules, trial dates, match fixtures, venues, and formats are subject to change due to operational requirements, weather conditions, or unforeseen circumstances. Final decisions will rest with JWS management.\n\n7. Players must maintain discipline, fitness, and sportsmanship at all times. Any misconduct or violation of rules may lead to suspension or cancellation of membership without refund.\n\n8. JWS Sports is not responsible for any injuries, accidents, or loss/damage of personal belongings during training sessions, trials, matches, or related activities. Players participate at their own risk.\n\n9. Players must report on time for all training sessions, trials, and matches. Failure to do so may result in exclusion without compensation.\n\n10. JWS reserves the right to modify, update, or revise these terms and conditions at any time without prior notice.\n\n11. By registering for JWS Membership, the player agrees to abide by all the above terms and conditions.\n\n12. Additional 18% GST Applicable.\n\nYou agree to share information entered on this page with JWS Sports (owner of this page) and Razorpay, adhering to applicable laws.`
        }
      ],
      
      // Points & Limits
      referralPoints: { perUser: 0.5 },
      maxSquadSize: 20,
      matchTeamSize: 11,
      nextRegistrationNumber: 1,

      // Banners
      banners: [
        { id: 1, text: "GICL Mega Tournament Registration Open!", color: "linear-gradient(135deg, #1e3a8a, #3b82f6)", image: null },
        { id: 2, text: "Refer a Friend & Earn ₹50 Cash!", color: "linear-gradient(135deg, #b45309, #f59e0b)", image: null },
        { id: 3, text: "New Training Videos Uploaded", color: "linear-gradient(135deg, #064e3b, #10b981)", image: null }
      ],
      adBanners: [
        { id: 'ab1', text: 'Sponsor Ad 1', color: '#f59e0b', image: '' }
      ],

      // Generic Update Actions
      updateAgeGroups: (newGroups) => set({ ageGroups: newGroups }),
      updateJerseySizes: (sizes) => set({ jerseySizes: sizes }),
      updateBattingStyles: (styles) => set({ battingStyles: styles }),
      updateBowlingStyles: (styles) => set({ bowlingStyles: styles }),
      updateClubs: (newClubs) => set({ clubs: newClubs }),
      updateRegistrationTerms: (text) => set({ registrationTerms: text }),
      updatePlans: (newPlans) => set({ plans: newPlans }),
      updateBanners: (newBanners) => set({ banners: newBanners }),
      updateAdBanners: (newAdBanners) => set({ adBanners: newAdBanners }),
      updateBallTypes: (arr) => set({ ballTypes: arr }),
      updateLandingBgImage: (base64) => set({ landingBgImage: base64 }),
      
      // Specific Updates
      updateReferralPoints: (points) => set({ referralPoints: { perUser: points } }),
      updateMaxSquadSize: (size) => set({ maxSquadSize: size }),
      updateMatchTeamSize: (size) => set({ matchTeamSize: size }),
      incrementRegistrationNumber: () => set((state) => ({ nextRegistrationNumber: (state.nextRegistrationNumber || 1) + 1 })),
    }),
    {
      name: 'gicl-admin-config',
      version: 4,
    }
  )
);

