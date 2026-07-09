import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useFormStore } from '../../store/useFormStore';
import { playerAPI } from '../../services/api';
import Swal from 'sweetalert2';
import { User, Award, Activity, Star, Info, Shirt, Users, Video, X, Edit, Calendar, MapPin } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { compressImage } from '../../utils/imageCompressor';

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const { basicInfo, playerProfile, media, dashboardState, updateDashboard, updateBasicInfo, updatePlayerProfile } = useFormStore();
  const { jersey_sizes: jerseySizes = [] } = useConfig();
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const fileInputRef = useRef(null);

  // Track whether we've loaded from API yet — prevents flash redirect
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [photoCacheBuster, setPhotoCacheBuster] = useState(Date.now());

  const getDisplayPhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url; // Base64 local preview
    return `${url}?t=${photoCacheBuster}`;
  };

  // Sync ALL profile data from backend on every mount (handles refresh / new login)
  useEffect(() => {
    playerAPI.getProfile()
      .then((res) => {
        const p = res.data?.player || res.data;
        console.log('[DEBUG] Fetched player profile:', p);
        if (!p) { setProfileLoaded(true); return; }

        // Calculate age from dob
        let age = '';
        if (p.dob) {
          const diff = Date.now() - new Date(p.dob).getTime();
          age = String(Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
        }

        // Sync basicInfo (personal details)
        updateBasicInfo({
          giclId:           p.gicl_id          || basicInfo.giclId,
          email:            p.email            || basicInfo.email,
          firstName:        p.first_name        || basicInfo.firstName,
          middleName:       p.middle_name       || basicInfo.middleName,
          lastName:         p.last_name         || basicInfo.lastName,
          dob:              p.dob               || basicInfo.dob,
          gender:           p.gender            || basicInfo.gender,
          whatsapp:         p.whatsapp          || basicInfo.whatsapp,
          bloodGroup:       p.blood_group       || basicInfo.bloodGroup,
          parentName:       p.parent_name       || basicInfo.parentName,
          manualIdCardUrl:  p.manual_id_card_url || basicInfo.manualIdCardUrl,
          addressLine1:     p.address_line1     || basicInfo.addressLine1,
          addressLine2:     p.address_line2     || basicInfo.addressLine2,
          city:             p.city              || basicInfo.city,
          stateCode:        p.state_code        || basicInfo.stateCode,
          country:          p.country           || basicInfo.country,
          zipCode:          p.zip_code          || basicInfo.zipCode,
          emergencyContact: p.emergency_contact || basicInfo.emergencyContact,
          emergencyContactName: p.emergency_contact_name || basicInfo.emergencyContactName,
          jerseySize:       p.jersey_size       || basicInfo.jerseySize,
          jerseyName:       p.first_name        || basicInfo.jerseyName,
          instagramLink:    p.instagram_link    || basicInfo.instagramLink,
          aadharUrl:        p.aadhar_url        || basicInfo.aadharUrl,
        });

        // Sync playerProfile (cricket details)
        updatePlayerProfile({
          battingStyle:     p.batting_style     || playerProfile.battingStyle,
          bowlingStyle:     p.bowling_style     || playerProfile.bowlingStyle,
          height:           p.height            || playerProfile.height,
          weight:           p.weight            || playerProfile.weight,
          jerseySize:       p.jersey_size       || playerProfile.jerseySize,
          age:              age                 || playerProfile.age,
          ballsSelected:    Array.isArray(p.balls_selected)  ? p.balls_selected  : (playerProfile.ballsSelected  || []),
          fieldPositions:   Array.isArray(p.field_positions) ? p.field_positions : (playerProfile.fieldPositions || []),
          clubsDetails:     Array.isArray(p.clubs_details)   ? p.clubs_details   : (playerProfile.clubsDetails   || []),
          cricketHistory:   Array.isArray(p.cricket_history) ? p.cricket_history : (playerProfile.cricketHistory || []),
          clubAssociated:   p.club_associated   || playerProfile.clubAssociated,
        });

        // Sync dashboardState — use actual DB value, not stale store default
        updateDashboard({
          isDashboardUnlocked: !!p.is_dashboard_unlocked,
          profilePhotoUrl:     p.profile_photo_url || dashboardState.profilePhotoUrl,
          referralPoints:      p.referral_balance  ?? dashboardState.referralPoints,
          allocatedCoach:      p.coach || null,
          uploadedVideos:      p.videos || []
        });
      })
      .catch(() => { /* silent — show local store data as fallback */ })
      .finally(() => setProfileLoaded(true)); // always mark as loaded

    // Fetch upcoming matches
    playerAPI.getMatches()
      .then(res => {
        if (res.data?.success && res.data.matches) {
          const now = new Date();
          const upcoming = res.data.matches
            .filter(m => new Date(m.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(m => ({
              ...m,
              opponent: m.title || 'TBA',
              location: m.venue || m.location || 'TBA',
              type: m.match_type || m.type || 'Match'
            }));
          updateDashboard({ upcomingMatches: upcoming });
        }
      })
      .catch(() => { /* silent */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [photoUploading, setPhotoUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const rawFile = e.target.files[0];
    if (!rawFile) return;
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => updateDashboard({ profilePhotoUrl: reader.result });
    reader.readAsDataURL(rawFile);
    // Compress then upload to backend
    setPhotoUploading(true);
    try {
      const file = await compressImage(rawFile, { maxDimension: 800, quality: 0.8 });
      const res = await playerAPI.uploadPhoto(file);
      const url = res.data?.url;
      if (url) {
        updateDashboard({ profilePhotoUrl: url });
        setPhotoCacheBuster(Date.now());
      }
      Swal.fire({ icon: 'success', title: 'Photo Updated!', timer: 1500, showConfirmButton: false,
        background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch {
      Swal.fire({ icon: 'error', title: 'Upload failed', text: 'Please try again.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
    } finally { setPhotoUploading(false); }
  };

  const handleUpdateGenderBloodGroup = async () => {
    const genders = ['Male', 'Female', 'Other'];
    const genderOptionsHtml = genders.map(g => `<option value="${g}" ${basicInfo.gender === g ? 'selected' : ''}>${g}</option>`).join('');

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodOptionsHtml = bloodGroups.map(g => `<option value="${g}" ${basicInfo.bloodGroup === g ? 'selected' : ''}>${g}</option>`).join('');

    const { value: formValues } = await Swal.fire({
      title: 'Update Gender & Blood Group',
      html: `
        <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left; width: 80%; margin: 0 auto; padding: 0.5rem 0;">
          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Gender *</label>
            <select id="swal-gender" class="swal2-select" style="display: flex; margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
              <option value="">Select Gender</option>
              ${genderOptionsHtml}
            </select>
          </div>
          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Blood Group</label>
            <select id="swal-blood-group" class="swal2-select" style="display: flex; margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
              <option value="">Select Blood Group</option>
              ${bloodOptionsHtml}
            </select>
          </div>
        </div>
      `,
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      showCancelButton: true,
      confirmButtonColor: '#cbf905',
      confirmButtonText: 'Save',
      focusConfirm: false,
      preConfirm: () => {
        return {
          gender: document.getElementById('swal-gender').value,
          bloodGroup: document.getElementById('swal-blood-group').value
        };
      }
    });

    if (formValues) {
      if (!formValues.gender) {
        return Swal.fire({
          icon: 'warning',
          title: 'Gender Required',
          text: 'Please select a valid gender.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
      try {
        Swal.showLoading();
        await playerAPI.updateProfile(formValues);
        updateBasicInfo(formValues);
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Gender & Blood Group successfully updated.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.message || 'Could not update details.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
    }
  };

  const handleUpdateName = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Update Name',
      html: `
        <div style="display: flex; flex-direction: column; gap: 1rem; padding: 1rem 0;">
          <div style="text-align: left; width: 85%; margin: 0 auto;">
            <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">First Name *</label>
            <input id="swal-first-name" class="swal2-input" placeholder="First Name" value="${basicInfo.firstName || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
          </div>
          <div style="text-align: left; width: 85%; margin: 0 auto;">
            <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Middle Name</label>
            <input id="swal-middle-name" class="swal2-input" placeholder="Middle Name" value="${basicInfo.middleName || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
          </div>
          <div style="text-align: left; width: 85%; margin: 0 auto;">
            <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Last Name *</label>
            <input id="swal-last-name" class="swal2-input" placeholder="Last Name" value="${basicInfo.lastName || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
          </div>
        </div>
      `,
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      showCancelButton: true,
      confirmButtonColor: '#cbf905',
      confirmButtonText: 'Save',
      focusConfirm: false,
      preConfirm: () => {
        const firstName = document.getElementById('swal-first-name').value.trim();
        const middleName = document.getElementById('swal-middle-name').value.trim();
        const lastName = document.getElementById('swal-last-name').value.trim();
        return { firstName, middleName, lastName };
      }
    });

    if (formValues) {
      if (!formValues.firstName || !formValues.lastName) {
        return Swal.fire({
          icon: 'warning',
          title: 'Required Fields',
          text: 'First Name and Last Name are required.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
      try {
        Swal.showLoading();
        await playerAPI.updateProfile(formValues);
        updateBasicInfo(formValues);
        
        // Also update AuthContext user state if possible
        const stored = localStorage.getItem('jws_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.first_name = formValues.firstName;
          parsed.middle_name = formValues.middleName;
          parsed.last_name = formValues.lastName;
          localStorage.setItem('jws_user', JSON.stringify(parsed));
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Name successfully updated.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.message || 'Could not update name.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
    }
  };

  const handleUpdateDOB = async () => {
    const { value: selectedDOB } = await Swal.fire({
      title: 'Update Date of Birth',
      html: `
        <div style="text-align: left; width: 80%; margin: 0 auto;">
          <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Date of Birth *</label>
          <input type="date" id="swal-dob" class="swal2-input" value="${basicInfo.dob || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
        </div>
      `,
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      showCancelButton: true,
      confirmButtonColor: '#cbf905',
      confirmButtonText: 'Save',
      focusConfirm: false,
      preConfirm: () => {
        return document.getElementById('swal-dob').value;
      }
    });

    if (selectedDOB) {
      try {
        Swal.showLoading();
        await playerAPI.updateProfile({ dob: selectedDOB });
        
        // Calculate age
        const birthDate = new Date(selectedDOB);
        const today = new Date();
        let newAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          newAge--;
        }

        updateBasicInfo({ dob: selectedDOB });
        updatePlayerProfile({ age: String(newAge) });

        // Update local session
        const stored = localStorage.getItem('jws_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.dob = selectedDOB;
          localStorage.setItem('jws_user', JSON.stringify(parsed));
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Date of Birth successfully updated.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.message || 'Could not update Date of Birth.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
    }
  };

  const handleUpdateEmail = async () => {
    const { value: email } = await Swal.fire({
      title: 'Update Email Address',
      html: `
        <div style="text-align: left; width: 80%; margin: 0 auto;">
          <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Email Address *</label>
          <input type="email" id="swal-email" class="swal2-input" placeholder="john@example.com" value="${basicInfo.email || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
        </div>
      `,
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      showCancelButton: true,
      confirmButtonColor: '#cbf905',
      confirmButtonText: 'Save',
      focusConfirm: false,
      preConfirm: () => {
        const val = document.getElementById('swal-email').value.trim().toLowerCase();
        if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          Swal.showValidationMessage('Please enter a valid email address');
          return false;
        }
        return val;
      }
    });

    if (email) {
      try {
        Swal.showLoading();
        await playerAPI.updateProfile({ email });
        updateBasicInfo({ email });

        // Update local session
        const stored = localStorage.getItem('jws_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.email = email;
          localStorage.setItem('jws_user', JSON.stringify(parsed));
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Email address successfully updated.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.message || 'Could not update email address.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
    }
  };

  const handleUpdateWhatsApp = async () => {
    const defaultVal = basicInfo.whatsapp && basicInfo.whatsapp.startsWith('+') ? basicInfo.whatsapp : '+91';
    const { value: whatsapp } = await Swal.fire({
      title: 'Update WhatsApp Number',
      html: `
        <div style="text-align: left; width: 80%; margin: 0 auto;">
          <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">WhatsApp Number *</label>
          <input type="text" id="swal-whatsapp" class="swal2-input" placeholder="+91..." value="${defaultVal}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
        </div>
      `,
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      showCancelButton: true,
      confirmButtonColor: '#cbf905',
      confirmButtonText: 'Save',
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById('swal-whatsapp');
        if (input) {
          input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d+]/g, '').substring(0, 13);
          });
        }
      },
      preConfirm: () => {
        const val = document.getElementById('swal-whatsapp').value.trim();
        if (!/^\+91\d{10}$/.test(val)) {
          Swal.showValidationMessage('Please enter a valid 10-digit number starting with +91');
          return false;
        }
        return val;
      }
    });

    if (whatsapp) {
      try {
        Swal.showLoading();
        await playerAPI.updateProfile({ whatsapp });
        updateBasicInfo({ whatsapp });

        // Update local session
        const stored = localStorage.getItem('jws_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.whatsapp = whatsapp;
          localStorage.setItem('jws_user', JSON.stringify(parsed));
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'WhatsApp number successfully updated.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.message || 'Could not update WhatsApp number.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
    }
  };

  const handleUpdateParentName = async () => {
    const { value: parentName } = await Swal.fire({
      title: 'Update Parent/Guardian Name',
      html: `
        <div style="text-align: left; width: 80%; margin: 0 auto;">
          <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Parent/Guardian Name *</label>
          <input type="text" id="swal-parent-name" class="swal2-input" placeholder="Parent/Guardian Name" value="${basicInfo.emergencyContactName || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
        </div>
      `,
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      showCancelButton: true,
      confirmButtonColor: '#cbf905',
      confirmButtonText: 'Save',
      focusConfirm: false,
      preConfirm: () => {
        return document.getElementById('swal-parent-name').value.trim();
      }
    });

    if (parentName) {
      try {
        Swal.showLoading();
        await playerAPI.updateProfile({ emergencyContactName: parentName });
        updateBasicInfo({ emergencyContactName: parentName });

        // Update local session
        const stored = localStorage.getItem('jws_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.emergency_contact_name = parentName;
          localStorage.setItem('jws_user', JSON.stringify(parsed));
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Parent/Guardian Name successfully updated.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.message || 'Could not update Parent/Guardian Name.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
    }
  };

  const handleUpdateParentNumber = async () => {
    const defaultVal = basicInfo.emergencyContact && basicInfo.emergencyContact.startsWith('+') ? basicInfo.emergencyContact : '+91';
    const { value: parentNumber } = await Swal.fire({
      title: 'Update Parent/Guardian Number',
      html: `
        <div style="text-align: left; width: 80%; margin: 0 auto;">
          <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Parent/Guardian Number *</label>
          <input type="text" id="swal-parent-number" class="swal2-input" placeholder="+91..." value="${defaultVal}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
        </div>
      `,
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      showCancelButton: true,
      confirmButtonColor: '#cbf905',
      confirmButtonText: 'Save',
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById('swal-parent-number');
        if (input) {
          input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d+]/g, '').substring(0, 13);
          });
        }
      },
      preConfirm: () => {
        const val = document.getElementById('swal-parent-number').value.trim();
        if (!/^\+91\d{10}$/.test(val)) {
          Swal.showValidationMessage('Please enter a valid 10-digit number starting with +91');
          return false;
        }
        return val;
      }
    });

    if (parentNumber) {
      try {
        Swal.showLoading();
        await playerAPI.updateProfile({ emergencyContact: parentNumber });
        updateBasicInfo({ emergencyContact: parentNumber });

        // Update local session
        const stored = localStorage.getItem('jws_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.emergency_contact = parentNumber;
          localStorage.setItem('jws_user', JSON.stringify(parsed));
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Parent/Guardian Number successfully updated.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.message || 'Could not update Parent/Guardian Number.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
    }
  };

  const handleUpdateAddress = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Update Address',
      html: `
        <div style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left; width: 85%; margin: 0 auto;">
          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Flat no, Wing name, Sector *</label>
            <input id="addr-line1" class="swal2-input" value="${basicInfo.addressLine1 || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
          </div>
          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Area and Address</label>
            <input id="addr-line2" class="swal2-input" value="${basicInfo.addressLine2 || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">City *</label>
              <input id="addr-city" class="swal2-input" value="${basicInfo.city || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
            </div>
            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Pincode *</label>
              <input id="addr-zip" class="swal2-input" value="${basicInfo.zipCode || ''}" style="margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
            </div>
          </div>
        </div>
      `,
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      showCancelButton: true,
      confirmButtonColor: '#cbf905',
      preConfirm: () => {
        return {
          addressLine1: document.getElementById('addr-line1').value.trim(),
          addressLine2: document.getElementById('addr-line2').value.trim(),
          city: document.getElementById('addr-city').value.trim(),
          zipCode: document.getElementById('addr-zip').value.trim(),
        };
      }
    });

    if (formValues) {
      if (!formValues.addressLine1 || !formValues.city || !formValues.zipCode) {
        return Swal.fire({ icon: 'warning', title: 'Required Fields', text: 'Please fill in all mandatory address fields.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
      }
      try {
        Swal.showLoading();
        await playerAPI.updateProfile(formValues);
        updateBasicInfo(formValues);

        // Update local session
        const stored = localStorage.getItem('jws_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.address_line1 = formValues.addressLine1;
          parsed.address_line2 = formValues.addressLine2;
          parsed.city = formValues.city;
          parsed.zip_code = formValues.zipCode;
          localStorage.setItem('jws_user', JSON.stringify(parsed));
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Address successfully updated.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.message || 'Could not update address.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
    }
  };

  const handleUpdateJerseySize = async () => {
    const optionsHtml = (jerseySizes || ['S', 'M', 'L', 'XL', 'XXL']).map(sz => 
      `<option value="${sz}" ${basicInfo.jerseySize === sz ? 'selected' : ''}>${sz}</option>`
    ).join('');

    const { value: jerseySize } = await Swal.fire({
      title: 'Update Jersey Size',
      html: `
        <div style="text-align: left; width: 80%; margin: 0 auto;">
          <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Jersey Size *</label>
          <select id="swal-jersey-size" class="swal2-select" style="display: flex; margin: 0.25rem 0 0 0; width: 100%; height: 2.5rem; background: var(--bg-surface-elevated); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 0.5rem;">
            <option value="">Select Size</option>
            ${optionsHtml}
          </select>
        </div>
      `,
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      showCancelButton: true,
      confirmButtonColor: '#cbf905',
      confirmButtonText: 'Save',
      focusConfirm: false,
      preConfirm: () => {
        return document.getElementById('swal-jersey-size').value;
      }
    });

    if (jerseySize) {
      try {
        Swal.showLoading();
        await playerAPI.updateProfile({ jerseySize });
        updateBasicInfo({ jerseySize });

        // Update local session
        const stored = localStorage.getItem('jws_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.jersey_size = jerseySize;
          localStorage.setItem('jws_user', JSON.stringify(parsed));
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Jersey Size successfully updated.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.message || 'Could not update Jersey Size.',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          confirmButtonColor: '#cbf905'
        });
      }
    }
  };

  const handleDownloadIdCard = () => {
    if (!basicInfo.manualIdCardUrl) {
      return Swal.fire({ icon: 'info', title: 'Not Available', text: 'Your ID card has not been uploaded yet.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    }
    // Open in new tab to view/download
    window.open(basicInfo.manualIdCardUrl, '_blank');
  };

  // Show spinner while waiting for API — prevents flash redirect
  if (!profileLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--bg-surface-elevated)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading your profile…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }


  const uploadedVideos = dashboardState.uploadedVideos || [];
  const poorVideo = uploadedVideos.find(v => v.review_flag === 'poor');
  const selectedVideo = uploadedVideos.find(v => v.review_flag === 'good' || v.review_flag === 'best');
  const isSelected = !!selectedVideo;
  const hasPendingVideos = uploadedVideos.some(v => v.status === 'Pending');
  const isRejected = !isSelected && !!poorVideo && !hasPendingVideos;
  const isUnderReview = !isSelected && (hasPendingVideos || (uploadedVideos.length > 0 && !isRejected));
  const hasBookedMatch = dashboardState.upcomingMatches && dashboardState.upcomingMatches.length > 0;

  return (
    <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="heading-1" style={{ marginBottom: '1.5rem' }}>Dashboard</h1>

      {/* Profile Header & Points */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Profile Card */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--bg-surface-elevated)' }}>
          <div style={{ position: 'relative' }}>
            <div 
              style={{ 
                width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                border: '2px solid var(--brand-primary)'
              }}
            >
              {dashboardState.profilePhotoUrl ? (
                <img src={getDisplayPhotoUrl(dashboardState.profilePhotoUrl)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="var(--text-secondary)" />
              )}
            </div>
            <button 
              onClick={() => !photoUploading && fileInputRef.current.click()}
              style={{ 
                position: 'absolute', bottom: -5, right: -5, backgroundColor: photoUploading ? 'var(--text-secondary)' : 'var(--brand-accent)', 
                color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-surface)',
                cursor: photoUploading ? 'wait' : 'pointer', fontSize: '16px', fontWeight: 700
              }}
              title={photoUploading ? 'Uploading...' : 'Change photo'}
            >
              {photoUploading ? '⟳' : '+'}
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </div>
          <div>
            <h2 className="heading-2">{basicInfo.firstName || 'Player Name'} {basicInfo.lastName}</h2>
            <p className="text-secondary">{playerProfile.cricketType || 'Cricket'} Player | ID: {basicInfo.giclId || 'PENDING'}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>{playerProfile.battingStyle || 'BAT'}</span>
              <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>{playerProfile.bowlingStyle || 'BOWL'}</span>
              {(playerProfile.clubsDetails && playerProfile.clubsDetails.length > 0) && (
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,199,44,0.2)', color: 'var(--brand-primary)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                  Club Player
                </span>
              )}
            </div>
            {basicInfo.giclId && (
              <button 
                onClick={handleDownloadIdCard}
                disabled={!basicInfo.manualIdCardUrl}
                style={{ 
                  marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', 
                  backgroundColor: basicInfo.manualIdCardUrl ? 'var(--brand-primary)' : 'rgba(255,255,255,0.1)', 
                  color: basicInfo.manualIdCardUrl ? '#121A3F' : 'var(--text-secondary)', 
                  fontWeight: 700, border: 'none', cursor: basicInfo.manualIdCardUrl ? 'pointer' : 'not-allowed', 
                  fontSize: '0.85rem'
                }}
              >
                {basicInfo.manualIdCardUrl ? '⬇ Download ID Card' : 'ID Card Pending...'}
              </button>
            )}
          </div>
        </div>

        {/* JWS ID Card */}
        <div style={{ background: 'linear-gradient(135deg, #513b8a, #cbf905)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
            <Award size={150} />
          </div>
          <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>JWS Player ID</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, lineHeight: 1.2, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {basicInfo.giclId || 'PENDING'}
          </h2>
          <p style={{ fontSize: '0.8rem', marginTop: '0.75rem', opacity: 0.9 }}>Junior World Series 2026</p>
        </div>

        {/* Selector Card */}
        {dashboardState.allocatedCoach && (
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--brand-primary)', position: 'relative', overflow: 'hidden' }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Allocated Selector</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated)', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--brand-primary)' }}>
                {dashboardState.allocatedCoach.profile_photo_url ? (
                  <img src={dashboardState.allocatedCoach.profile_photo_url} alt="Selector Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={30} color="var(--text-secondary)" style={{ margin: '15px' }} />
                )}
              </div>
              <div>
                <h3 className="heading-3" style={{ margin: 0, fontSize: '1.25rem' }}>{dashboardState.allocatedCoach.first_name} {dashboardState.allocatedCoach.last_name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{dashboardState.allocatedCoach.city || 'JWS'} • JWS Official Selector</p>
                <button onClick={() => setShowCoachModal(true)} style={{ background: 'none', border: 'none', padding: 0, marginTop: '0.5rem', color: 'var(--brand-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>View Details</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Personal Details Widget */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={20} color="var(--brand-primary)" />
            Personal & Contact Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem', alignItems: 'center' }}>
              <span className="text-small text-secondary">Full Name</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{basicInfo.firstName} {basicInfo.middleName} {basicInfo.lastName}</span>
                <button 
                  onClick={handleUpdateName} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}
                  title="Update name"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem', alignItems: 'center' }}>
              <span className="text-small text-secondary">Date of Birth / Age</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{basicInfo.dob ? new Date(basicInfo.dob).toLocaleDateString() : 'N/A'} ({playerProfile.age || 'N/A'} Yrs)</span>
                <button 
                  onClick={handleUpdateDOB} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}
                  title="Update Date of Birth"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem', alignItems: 'center' }}>
              <span className="text-small text-secondary">Gender / Blood Group</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{basicInfo.gender || 'N/A'} / {basicInfo.bloodGroup || 'N/A'}</span>
                <button 
                  onClick={handleUpdateGenderBloodGroup} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}
                  title="Update gender & blood group"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem', alignItems: 'center' }}>
              <span className="text-small text-secondary">Email</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{basicInfo.email || 'N/A'}</span>
                <button 
                  onClick={handleUpdateEmail} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}
                  title="Update Email"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem', alignItems: 'center' }}>
              <span className="text-small text-secondary">WhatsApp</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{basicInfo.whatsapp || 'N/A'}</span>
                <button 
                  onClick={handleUpdateWhatsApp} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}
                  title="Update WhatsApp"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem', alignItems: 'center' }}>
              <span className="text-small text-secondary">Parent / Guardian Name</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{basicInfo.emergencyContactName || 'N/A'}</span>
                <button 
                  onClick={handleUpdateParentName} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}
                  title="Update Parent Name"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem', alignItems: 'center' }}>
              <span className="text-small text-secondary">Parent / Guardian Number</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{basicInfo.emergencyContact || 'N/A'}</span>
                <button 
                  onClick={handleUpdateParentNumber} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}
                  title="Update Parent Number"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>
              <span className="text-small text-secondary">Aadhaar Card</span>
              {basicInfo.aadharUrl ? (
                <a href={basicInfo.aadharUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'underline' }}>View Aadhaar</a>
              ) : (
                <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Not Uploaded</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small text-secondary">Address</span>
                <button 
                  onClick={handleUpdateAddress} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}
                  title="Update Address"
                >
                  <Edit size={14} />
                </button>
              </div>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.4 }}>
                {basicInfo.addressLine1 ? `${basicInfo.addressLine1}${basicInfo.addressLine2 ? `, ${basicInfo.addressLine2}` : ''}, ${basicInfo.city}, ${basicInfo.stateCode} - ${basicInfo.zipCode}, ${basicInfo.country}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Cricket & Club Details Widget */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--brand-primary)" />
            Cricket Profile
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>
              <span className="text-small text-secondary">Batting / Bowling Style</span>
              <span style={{ fontWeight: 500 }}>{playerProfile.battingStyle || 'N/A'} / {playerProfile.bowlingStyle || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>
              <span className="text-small text-secondary">Height / Weight</span>
              <span style={{ fontWeight: 500 }}>{playerProfile.height || 'N/A'} cm / {playerProfile.weight || 'N/A'} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>
              <span className="text-small text-secondary">Ball Types Selected</span>
              <span style={{ fontWeight: 500 }}>{(playerProfile.ballsSelected || []).join(', ') || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem', alignItems: 'center' }}>
              <span className="text-small text-secondary">Fielding Positions</span>
              <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%', lineHeight: 1.4 }} title={(playerProfile.fieldPositions || []).join(', ')}>
                {(playerProfile.fieldPositions || []).join(', ') || 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>
              <span className="text-small text-secondary">Clubs & Permissions</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {(playerProfile.clubsDetails && playerProfile.clubsDetails.length > 0) ? (
                  playerProfile.clubsDetails.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 500 }}>{c.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Outside? <strong style={{ color: c.allowedOutside === 'yes' ? 'var(--success)' : 'var(--error)' }}>{c.allowedOutside.toUpperCase()}</strong></span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>None</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span className="text-small text-secondary">Cricket History (Matches Played)</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {(playerProfile.cricketHistory && playerProfile.cricketHistory.length > 0) ? (
                  playerProfile.cricketHistory.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', backgroundColor: 'var(--bg-surface-elevated)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{h.level}</span>
                      <span style={{ fontWeight: 600 }}>{h.matches || 0}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontWeight: 500, fontSize: '0.875rem', gridColumn: 'span 2' }}>No history recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Kit & Gear Widget */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shirt size={20} color="var(--brand-primary)" />
            Kit & Gear
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>
              <span className="text-small text-secondary">Jersey Name</span>
              <span style={{ fontWeight: 500, textTransform: 'uppercase' }}>{basicInfo.jerseyName || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem', alignItems: 'center' }}>
              <span className="text-small text-secondary">Jersey Size</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{basicInfo.jerseySize || 'N/A'}</span>
                <button 
                  onClick={handleUpdateJerseySize} 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}
                  title="Update Jersey Size"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Calendar / Selection Journey Widget */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={20} color="var(--brand-primary)" />
            {isSelected ? 'Upcoming Offline Trials' : 'Selection Status'}
          </h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {(() => {
              if (isSelected) {
                if (hasBookedMatch) {
                  const nextMatch = dashboardState.upcomingMatches[0];
                  return (
                    <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(203,249,5,0.15)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(203,249,5,0.1)', padding: '0.2rem 0.65rem', borderRadius: 9999, border: '1px solid rgba(203,249,5,0.25)' }}>
                          {(nextMatch.type?.toLowerCase() === 'league' || nextMatch.type?.toLowerCase() === 'trial') ? 'Trial' : nextMatch.type}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(16,185,129,0.12)', padding: '0.2rem 0.65rem', borderRadius: 9999, border: '1px solid rgba(16,185,129,0.3)' }}>
                          Slot Booked
                        </span>
                      </div>
                      <p style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.75rem', color: '#fff', lineHeight: 1.3 }}>{nextMatch.opponent}</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--brand-primary)', fontSize: '0.84rem', fontWeight: 500 }}>
                          <Calendar size={14} style={{ flexShrink: 0, color: 'var(--brand-primary)' }} />
                          <span>{new Date(nextMatch.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--brand-primary)', fontSize: '0.84rem', fontWeight: 500 }}>
                          <MapPin size={14} style={{ flexShrink: 0, color: 'var(--brand-primary)' }} />
                          <span>{nextMatch.location || '—'}</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <p style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>Selected! 🎉</p>
                      <p className="text-small text-secondary" style={{ lineHeight: '1.4', marginBottom: '1rem' }}>
                        You are selected for offline trials! Reason/Feedback from selector:
                        <span style={{ display: 'block', fontStyle: 'italic', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                          "{selectedVideo.review_comment}"
                        </span>
                      </p>
                      <button 
                        className="btn-primary" 
                        onClick={() => navigate('/dashboard/trials')}
                        style={{ width: '100%', fontSize: '0.875rem', padding: '0.6rem 1rem' }}
                      >
                        Book Your Upcoming Trial Slot
                      </button>
                    </div>
                  );
                }
              }

              if (isUnderReview) {
                return (
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                    <p style={{ fontWeight: 700, color: '#eab308', marginBottom: '0.5rem' }}>Under Review</p>
                    <p className="text-secondary text-small" style={{ lineHeight: '1.4', margin: 0 }}>
                      Your videos have been submitted. A Selector will review them soon.
                    </p>
                  </div>
                );
              }

              if (isRejected) {
                return (
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.5rem' }}>Not Selected</p>
                    <p className="text-small text-secondary" style={{ lineHeight: '1.4' }}>
                      You are not selected with the reason stated by selector:
                    </p>
                    <p className="text-small" style={{ fontStyle: 'italic', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                      "{poorVideo.review_comment}"
                    </p>
                  </div>
                );
              }

              // Default: Not Selected yet (no reviews or no uploads)
              return (
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--bg-surface-elevated)' }}>
                  <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.5rem' }}>Not Selected</p>
                  <p className="text-secondary text-small" style={{ lineHeight: '1.4', marginBottom: '1rem' }}>
                    You are not selected yet. Please upload your videos under "Upload Batting & Bowling Videos" in the sidebar to begin your selector review.
                  </p>
                  <button 
                    className="btn-primary" 
                    onClick={() => navigate('/dashboard/gameplay')}
                    style={{ width: '100%', fontSize: '0.875rem', padding: '0.6rem 1rem' }}
                  >
                    Upload Batting & Bowling Videos
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

    </motion.div>

    {showCoachModal && dashboardState.allocatedCoach && (
      <div className="modal-overlay" onClick={() => setShowCoachModal(false)}>
        <motion.div className="modal-content" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 450, width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
          <button onClick={() => setShowCoachModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', color: 'var(--text-secondary)' }}><X size={24} /></button>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated)', overflow: 'hidden', border: '3px solid var(--brand-primary)', marginBottom: '1rem' }}>
              {dashboardState.allocatedCoach.profile_photo_url ? (
                <img src={dashboardState.allocatedCoach.profile_photo_url} alt="Selector Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={50} color="var(--text-secondary)" style={{ margin: '25px' }} />
              )}
            </div>
            <h2 className="heading-2" style={{ marginBottom: '0.25rem' }}>Selector {dashboardState.allocatedCoach.first_name} {dashboardState.allocatedCoach.last_name}</h2>
            <span style={{ backgroundColor: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 600 }}>
              JWS Official Selector
            </span>
          </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <p className="text-small text-secondary" style={{ marginBottom: '0.25rem' }}>Location</p>
                <p style={{ fontWeight: 600 }}>{dashboardState.allocatedCoach.city || 'N/A'}{dashboardState.allocatedCoach.state_code ? `, ${dashboardState.allocatedCoach.state_code}` : ''}</p>
              </div>
              <details style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, outline: 'none', userSelect: 'none' }} className="text-small text-secondary">
                  Selector Profile / Experience
                </summary>
                <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '0.75rem', paddingRight: '0.5rem' }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{dashboardState.allocatedCoach.coaching_history || 'Professional Selector Experience'}</p>
                </div>
              </details>

              {dashboardState.allocatedCoach.cricket_history && (
                <details style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, outline: 'none', userSelect: 'none' }} className="text-small text-secondary">
                    Cricket History
                  </summary>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '0.75rem', paddingRight: '0.5rem' }}>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{dashboardState.allocatedCoach.cricket_history}</p>
                  </div>
                </details>
              )}
            </div>
        </motion.div>
      </div>
    )}
    </>
  );
};

export default PlayerDashboard;

