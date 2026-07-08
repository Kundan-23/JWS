import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { useFormStore } from '../../store/useFormStore';
import { useConfig } from '../../context/ConfigContext';
import { playerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

const Step2_BasicRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { basicInfo, updateBasicInfo, playerProfile, updatePlayerProfile } = useFormStore();
  const { jersey_sizes: jerseySizes, kids_jersey_measure_urls, adults_jersey_measure_urls } = useConfig();
  const [showMeasureModal, setShowMeasureModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pincodeState, setPincodeState] = useState({ loading: false, stateName: '', stateCode: '', error: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: { ...basicInfo, email: basicInfo.email || user?.email || '', middleName: basicInfo.middleName || '' },
    mode: 'onBlur'
  });

  const dobValue = watch('dob');

  // Fetch saved profile from database on mount to populate form
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await playerAPI.getProfile();
        if (res.data?.player) {
          const player = res.data.player;
          const mapped = {
            firstName: player.first_name || '',
            middleName: player.middle_name || '',
            lastName: player.last_name || '',
            dob: player.dob || '',
            gender: player.gender || '',
            whatsapp: player.whatsapp || '',
            emergencyContact: player.emergency_contact || '',
            emergencyContactName: player.emergency_contact_name || '',
            bloodGroup: player.blood_group || '',
            parentName: player.parent_name || '',
            addressLine1: player.address_line1 || '',
            addressLine2: player.address_line2 || '',
            city: player.city || '',
            country: player.country || '',
            zipCode: player.zip_code || '',
            jerseySize: player.jersey_size || '',
            instagramLink: player.instagram_link || '',
            email: player.email || user?.email || '',
            profilePhotoUrl: player.profile_photo_url || '',
          };
          updateBasicInfo(mapped);
          reset(mapped);
        }
      } catch (err) {
        console.error('Failed to load profile from backend:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [reset, updateBasicInfo, user?.email]);


  // Calculate age when DOB changes
  useEffect(() => {
    if (dobValue) {
      const birthDate = new Date(dobValue);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      // Store in playerProfile so it can be used later
      updatePlayerProfile({ age: age.toString() });
    }
  }, [dobValue, updatePlayerProfile]);



  // ── Live pincode lookup → auto-detect state & city ──────────
  const zipCodeValue = watch('zipCode');
  useEffect(() => {
    const pin = (zipCodeValue || '').trim().replace(/\D/g, '');
    if (pin.length !== 6) {
      setPincodeState({ loading: false, stateName: '', stateCode: '', error: '' });
      return;
    }
    setPincodeState(s => ({ ...s, loading: true, error: '' }));
    const timer = setTimeout(async () => {
      try {
        let foundState = '';
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const json = await res.json();
        if (json[0]?.Status === 'Success' && json[0]?.PostOffice?.length > 0) {
          const po = json[0].PostOffice[0];
          foundState = po.State || '';
          const currentCity = watch('city');
          if (!currentCity && po.District) setValue('city', po.District);
        } else {
          // Fallback to Zippopotam
          const res2 = await fetch(`https://api.zippopotam.us/in/${pin}`);
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.places && data2.places.length > 0) {
              foundState = data2.places[0].state;
              const currentCity = watch('city');
              if (!currentCity && data2.places[0]['place name']) setValue('city', data2.places[0]['place name']);
            }
          }
        }
        
        if (foundState) {
          setPincodeState({ loading: false, stateName: foundState, stateCode: '', error: '' });
        } else {
          setPincodeState({ loading: false, stateName: '', stateCode: '', error: 'Invalid pincode — check and re-enter' });
        }
      } catch {
        setPincodeState({ loading: false, stateName: '', stateCode: '', error: '' });
      }
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipCodeValue]);

  const currentAge = parseInt(playerProfile.age || '0', 10);
  const isKidSize = currentAge > 0 && currentAge < 16;

  // Myntra-styled kid age groups with measurements
  const kidSizeData = [
    { size: '6-7Y', chest: '31.0', length: '20.0', shoulder: '13.0' },
    { size: '8-9Y', chest: '33.0', length: '21.0', shoulder: '13.0' },
    { size: '9-10Y', chest: '35.0', length: '22.0', shoulder: '14.0' },
    { size: '10-11Y', chest: '37.0', length: '24.0', shoulder: '14.0' },
    { size: '11-12Y', chest: '39.0', length: '25.0', shoulder: '15.0' },
    { size: '13-14Y', chest: '41.0', length: '26.0', shoulder: '16.0' },
    { size: '15-16Y', chest: '43.0', length: '27.0', shoulder: '16.0' },
  ];
  
  const getKidSizeMatch = (sizeName) => {
    if (!sizeName) return null;
    const normalized = sizeName.toLowerCase().replace(/\s+/g, '');
    let match = kidSizeData.find(k => k.size.toLowerCase().replace(/\s+/g, '') === normalized);
    if (match) return match;
    const rangeMatch = normalized.match(/(\d+)-(\d+)/);
    if (rangeMatch) {
      const rangeStr = `${rangeMatch[1]}-${rangeMatch[2]}`;
      match = kidSizeData.find(k => k.size.toLowerCase().replace(/\s+/g, '').includes(rangeStr));
      if (match) return match;
    }
    return null;
  };

  const isKidSizeOption = (size) => {
    const s = size.toLowerCase();
    return s.includes('year') || s.includes('y') || s.includes('yr') || s.includes('kid') || s.includes('child') || s.includes('age') || /\d+-\d+/.test(s);
  };

  const kidOptions = (jerseySizes || []).filter(size => isKidSizeOption(size));
  const adultOptions = (jerseySizes || []).filter(size => !isKidSizeOption(size));

  // Use admin configuration sizes, falling back to all configured sizes if no specific match is found.
  const displaySizes = currentAge > 0 
    ? (isKidSize 
        ? (kidOptions.length > 0 ? kidOptions : (jerseySizes || [])) 
        : (adultOptions.length > 0 ? adultOptions : (jerseySizes || [])))
    : [];

  const handlePhoneChange = (val, onChange) => {
    if (val && val.startsWith('+91')) {
      const digits = val.replace(/\D/g, '');
      if (digits.length > 12) {
        onChange('+' + digits.slice(0, 12));
        return;
      }
    }
    onChange(val);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              // Convert blob to File object so it can be uploaded via FormData
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              setPhotoFile(compressedFile);
              
              const base64Reader = new FileReader();
              base64Reader.onloadend = () => { setValue('profilePhotoUrl', base64Reader.result); };
              base64Reader.readAsDataURL(compressedFile);
            }
          }, 'image/jpeg', 0.7);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Save to local store
      updateBasicInfo(data);
      // Save to backend
      await playerAPI.updateProfile({
        firstName: data.firstName, middleName: data.middleName, lastName: data.lastName, dob: data.dob,
        gender: data.gender, whatsapp: data.whatsapp, 
        emergencyContact: data.emergencyContact, emergencyContactName: data.emergencyContactName,
        bloodGroup: data.bloodGroup, parentName: data.parentName || '',
        addressLine1: data.addressLine1, addressLine2: data.addressLine2 || '',
        city: data.city, country: data.country, zipCode: data.zipCode,
        jerseySize: data.jerseySize, instagramLink: data.instagramLink || '',
      });
      // Upload photo if selected
      if (photoFile) await playerAPI.uploadPhoto(photoFile);
      navigate('/onboarding/payment');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error',
        text: err.response?.data?.message || 'Failed to save profile. Try again.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
    } finally { setSubmitting(false); }
  };

  if (loadingProfile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#fff' }}>
        <p style={{ fontWeight: 600, fontSize: '1rem' }}>Loading registration details...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="heading-2">Registration Form</h2>
        <p className="text-small" style={{ marginTop: '0.5rem' }}>Enter your personal details.</p>
        
        {/* Progress Bar */}
        <div className="progress-container" style={{ marginTop: '1rem' }}>
          <div className="progress-bar" style={{ width: '25%' }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Profile Photo */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1rem' }}>Profile Photo</h3>
          <Controller
            name="profilePhotoUrl"
            control={control}
            rules={{ required: 'Profile photo is required' }}
            render={({ field }) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--brand-primary)' }}>
                  {field.value ? (
                    <img src={field.value} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>👤</span>
                  )}
                </div>
                <label className="btn-secondary" style={{ width: 'auto', cursor: 'pointer', padding: '0.5rem 1rem' }}>
                  Upload Photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </label>
                {errors.profilePhotoUrl && <span className="form-error" style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{errors.profilePhotoUrl.message}</span>}
              </div>
            )}
          />
        </div>



        {/* Personal Info */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1rem' }}>Personal Info</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Controller
              name="firstName"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input {...field} className="form-input" placeholder="John" />
                  {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
                </div>
              )}
            />
            <Controller
              name="middleName"
              control={control}
              rules={{ required: 'Middle name is required' }}
              render={({ field }) => (
                <div className="form-group">
                  <label className="form-label">Middle Name *</label>
                  <input {...field} className="form-input" placeholder="Middle name" />
                  {errors.middleName && <p className="form-error">{errors.middleName.message}</p>}
                </div>
              )}
            />
            <Controller
              name="lastName"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input {...field} className="form-input" placeholder="Doe" />
                  {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
                </div>
              )}
            />
          </div>

          <Controller
            name="dob"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <div className="form-group">
                <label className="form-label">Date Of Birth *</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    {...field} 
                    className="form-input" 
                    style={{ colorScheme: 'dark', cursor: 'pointer', flex: 1 }} 
                  />
                  {currentAge > 0 && (
                    <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', color: 'var(--brand-primary)', fontWeight: 'bold' }}>
                      {currentAge} Yrs
                    </div>
                  )}
                </div>
                {errors.dob && <span className="form-error">{errors.dob.message}</span>}
              </div>
            )}
          />

          <Controller
            name="gender"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select {...field} className="form-input">
                  <option value="">--Select Gender--</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="form-error">{errors.gender.message}</span>}
              </div>
            )}
          />

          <Controller
            name="email"
            control={control}
            rules={{ 
              required: 'Required',
              pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "invalid email address" }
            }}
            render={({ field }) => (
              <div className="form-group">
                <label className="form-label">Your Email *</label>
                <input type="email" {...field} className="form-input" placeholder="john@example.com" />
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>
            )}
          />

          <Controller
            name="whatsapp"
            control={control}
            rules={{ 
              required: 'Required',
              validate: val => (val && isValidPhoneNumber(val)) || 'Invalid phone number'
            }}
            render={({ field }) => (
              <div className="form-group">
                <label className="form-label">WhatsApp Number *</label>
                <PhoneInput
                  international
                  defaultCountry="IN"
                  value={field.value}
                  onChange={(val) => handlePhoneChange(val, field.onChange)}
                  limitMaxLength={true}
                  maxLength={field.value?.startsWith('+91') ? 15 : undefined}
                  className="form-input"
                  style={{ '--PhoneInput-color--focus': 'transparent' }}
                />
                {errors.whatsapp && <span className="form-error">{errors.whatsapp.message}</span>}
              </div>
            )}
          />

          <Controller
            name="emergencyContactName"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Parent/Guardian Name *</label>
                <input {...field} className="form-input" placeholder="Parent/Guardian name" />
                {errors.emergencyContactName && <span className="form-error">{errors.emergencyContactName.message}</span>}
              </div>
            )}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Controller
              name="emergencyContact"
              control={control}
              rules={{ 
                required: 'Required',
                validate: val => (val && isValidPhoneNumber(val)) || 'Invalid phone number'
              }}
              render={({ field }) => (
                <div className="form-group">
                  <label className="form-label">Parent/Guardian Number *</label>
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    value={field.value}
                    onChange={(val) => handlePhoneChange(val, field.onChange)}
                    limitMaxLength={true}
                    maxLength={field.value?.startsWith('+91') ? 15 : undefined}
                    className="form-input"
                    style={{ '--PhoneInput-color--focus': 'transparent' }}
                  />
                  {errors.emergencyContact && <span className="form-error">{errors.emergencyContact.message}</span>}
                </div>
              )}
            />
            <Controller
              name="bloodGroup"
              control={control}
              render={({ field }) => (
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select {...field} className="form-input">
                    <option value="">--Select--</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              )}
            />
          </div>

          <Controller
            name="jerseySize"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">
                    {currentAge > 0 && isKidSize ? "SELECT SIZE (Age Group) *" : "Jersey / T-Shirt Size *"}
                  </label>
                  {currentAge > 0 && isKidSize && (
                    <button type="button" onClick={() => { setShowMeasureModal(true); setCurrentImageIndex(0); }} style={{ background: 'none', color: 'var(--brand-accent)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Kids tshirt measurment guide
                    </button>
                  )}
                </div>
                <select {...field} className="form-input" disabled={currentAge === 0}>
                  <option value="">
                    {currentAge === 0 ? "--Select Date Of Birth First--" : "--Select Size--"}
                  </option>
                  {currentAge > 0 && displaySizes.map(size => {
                    if (isKidSize) {
                      const match = getKidSizeMatch(size);
                      if (match) {
                        return <option key={size} value={size}>{size} (Chest: {match.chest}")</option>;
                      }
                    }
                    return <option key={size} value={size}>{size}</option>;
                  })}
                </select>
                {errors.jerseySize && <span className="form-error">{errors.jerseySize.message}</span>}
                {(!currentAge || !isKidSize) && (
                  <button type="button" onClick={() => { setShowMeasureModal(true); setCurrentImageIndex(0); }} style={{ background: 'none', color: 'var(--brand-accent)', textAlign: 'left', fontSize: '0.875rem', marginTop: '0.25rem', textDecoration: 'underline' }}>
                    Adults tshirt measurment guide
                  </button>
                )}
              </div>
            )}
          />
        </div>

        {/* Address */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1rem' }}>Address Details</h3>
          
          <Controller
            name="addressLine1"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Flat no, Wing name, Build name, Sector *</label>
                <input {...field} className="form-input" placeholder="Flat no, Wing name, Build name, Sector" />
                {errors.addressLine1 && <span className="form-error">{errors.addressLine1.message}</span>}
              </div>
            )}
          />

          <Controller
            name="addressLine2"
            control={control}
            render={({ field }) => (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Area and Address (optional)</label>
                <input {...field} className="form-input" placeholder="Area and Address" />
              </div>
            )}
          />

          <Controller
            name="zipCode"
            control={control}
            rules={{
              required: 'Required',
              pattern: { value: /^[0-9]{6}$/, message: 'Enter a valid 6-digit Indian pincode' }
            }}
            render={({ field }) => (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Pincode / ZIP *</label>
                <input
                  {...field}
                  className="form-input"
                  placeholder="e.g. 403001"
                  maxLength={6}
                  inputMode="numeric"
                />
                {/* Live state detection feedback */}
                {pincodeState.loading && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.3rem', display: 'block' }}>
                    🔍 Detecting state...
                  </span>
                )}
                {pincodeState.stateName && !pincodeState.loading && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '0.3rem', display: 'block', fontWeight: 600 }}>
                    📍 Detected: {pincodeState.stateName} ✅
                  </span>
                )}
                {pincodeState.error && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--error)', marginTop: '0.3rem', display: 'block' }}>
                    ⚠️ {pincodeState.error}
                  </span>
                )}
                {errors.zipCode && <span className="form-error">{errors.zipCode.message}</span>}
              </div>
            )}
          />

          <Controller
            name="city"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">City *</label>
                <input {...field} className="form-input" placeholder="London" />
                {errors.city && <span className="form-error">{errors.city.message}</span>}
              </div>
            )}
          />

          <Controller
            name="country"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Country *</label>
                <select {...field} className="form-input">
                  <option value="">Select Country</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="Australia">Australia</option>
                  <option value="Canada">Canada</option>
                </select>
                {errors.country && <span className="form-error">{errors.country.message}</span>}
              </div>
            )}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={submitting}>
          {submitting ? 'Saving...' : 'Proceed to Payment'}
        </button>
      </form>

      {/* Measure Size Modal */}
      <AnimatePresence>
        {showMeasureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowMeasureModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-content"
              style={{ maxWidth: (isKidSize ? (kids_jersey_measure_urls?.length > 0) : (adults_jersey_measure_urls?.length > 0)) ? '600px' : (isKidSize ? '600px' : '400px'), padding: '0', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const activeUrls = isKidSize ? (kids_jersey_measure_urls || []) : (adults_jersey_measure_urls || []);
                const hasImages = activeUrls.length > 0;
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                      <h2 className="heading-3">{isKidSize ? "Kids Measurement Guide" : "Adults Measurement Guide"}</h2>
                      <button onClick={() => setShowMeasureModal(false)} style={{ background: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
                    </div>
                    
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)' }}>
                      {hasImages ? (
                        <div style={{ textAlign: 'center' }}>
                          <img src={activeUrls[currentImageIndex]} alt="Measurement Guide" style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--radius-md)' }} />
                          {activeUrls.length > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                              <button 
                                onClick={() => setCurrentImageIndex(prev => (prev === 0 ? activeUrls.length - 1 : prev - 1))}
                                style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}
                              >
                                Prev
                              </button>
                              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {currentImageIndex + 1} / {activeUrls.length}
                              </span>
                              <button 
                                onClick={() => setCurrentImageIndex(prev => (prev === activeUrls.length - 1 ? 0 : prev + 1))}
                                style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      ) : isKidSize ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <th style={{ padding: '1rem', fontWeight: 600 }}>Size</th>
                          <th style={{ padding: '1rem', fontWeight: 600 }}>Chest (in)</th>
                          <th style={{ padding: '1rem', fontWeight: 600 }}>Front Length (in)</th>
                          <th style={{ padding: '1rem', fontWeight: 600 }}>Across Shoulder (in)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kidSizeData.map((row) => (
                          <tr key={row.size} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--brand-primary)' }}>{row.size}</td>
                            <td style={{ padding: '1rem' }}>{row.chest}</td>
                            <td style={{ padding: '1rem' }}>{row.length}</td>
                            <td style={{ padding: '1rem' }}>{row.shoulder}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '3rem' }}>📏</span>
                    <p style={{ marginTop: '1rem', fontWeight: 600 }}>Measurement Guide</p>
                    <p className="text-small" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Measure around the fullest part of your chest, keeping the tape horizontal.</p>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </motion.div>
    </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Step2_BasicRegistration;

