import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { useFormStore } from '../../store/useFormStore';
import { Camera, CheckCircle2, FileText, Upload } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { playerAPI } from '../../services/api';



const fieldPositionsList = [
  { id: 'keeper', label: 'Keeper' },
  { id: 'leg-side', label: 'Leg Side' },
  { id: 'left-sweeper', label: 'Left Sweeper' },
  { id: 'receiver', label: 'Receiver' },
  { id: 'point', label: 'Point' },
  { id: 'cover', label: 'Cover' },
  { id: 'right-sweeper', label: 'Right Sweeper' },
];

const Step4_PlayerProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { basicInfo, playerProfile, updatePlayerProfile } = useFormStore();
  const { batting_styles: battingStyles, bowling_styles: bowlingStyles, clubs: mockClubs, ball_types: ballTypes } = useConfig();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [customPosition, setCustomPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Calculate age from dob
  const [calculatedAge, setCalculatedAge] = useState('');
  useEffect(() => {
    if (basicInfo.dob) {
      const birthDate = new Date(basicInfo.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setCalculatedAge(age);
    }
  }, [basicInfo.dob]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { 
      ...playerProfile, 
      age: calculatedAge,
      instagramLink: playerProfile.instagramLink || '',
      height: playerProfile.height || '',
      weight: playerProfile.weight || '',
      battingStyle: playerProfile.battingStyle || '',
      bowlingStyle: playerProfile.bowlingStyle || '',
      clubAssociated: playerProfile.clubAssociated || 'no',
      clubsDetails: Array.isArray(playerProfile.clubsDetails) ? playerProfile.clubsDetails : [],
      ballsSelected: playerProfile.ballsSelected || [],
      fieldPositions: playerProfile.fieldPositions || [],
      cricketHistory: (() => {
        const defaultOrder = ['Taluka', 'District', 'State', 'National', 'International', 'Other'];
        const existing = Array.isArray(playerProfile.cricketHistory) ? playerProfile.cricketHistory : [];
        return defaultOrder.map(level => {
          const found = existing.find(e => e.level === level);
          return found ? found : { level, matches: 0 };
        });
      })()
    },
    mode: 'onBlur'
  });

  const watchBallsSelected = watch('ballsSelected') || [];
  const watchClubAssociated = watch('clubAssociated');

  const toggleBall = (id) => {
    if (id === 'none') {
      setValue('ballsSelected', ['none']);
      return;
    }
    let newSelected = [...watchBallsSelected].filter(b => b !== 'none');
    if (newSelected.includes(id)) {
      newSelected = newSelected.filter(b => b !== id);
    } else {
      newSelected.push(id);
    }
    setValue('ballsSelected', newSelected);
  };

  const handleAddCustomPosition = (e) => {
    e.preventDefault();
    if (customPosition.trim() !== '') {
      const current = watch('fieldPositions') || [];
      if (!current.includes(customPosition.trim())) {
        setValue('fieldPositions', [...current, customPosition.trim()]);
      }
      setCustomPosition('');
    }
  };

  const toggleClub = (club) => {
    const current = watch('clubsDetails') || [];
    const exists = current.find(c => c.name === club);
    if (exists) {
      setValue('clubsDetails', current.filter(c => c.name !== club));
    } else {
      setValue('clubsDetails', [...current, { name: club, allowedOutside: 'yes' }]);
    }
  };

  const updateClubPermission = (club, permission) => {
    const current = watch('clubsDetails') || [];
    setValue('clubsDetails', current.map(c => c.name === club ? { ...c, allowedOutside: permission } : c));
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      updatePlayerProfile({ ...data, age: calculatedAge });
      await playerAPI.updateProfile({
        height: data.height, weight: data.weight,
        battingStyle: data.battingStyle, bowlingStyle: data.bowlingStyle,
        fieldPositions: Array.isArray(data.fieldPositions) ? data.fieldPositions : (data.fieldPositions ? [data.fieldPositions] : []),
        ballsSelected: Array.isArray(data.ballsSelected) ? data.ballsSelected : (data.ballsSelected ? [data.ballsSelected] : []),
        cricketHistory: data.cricketHistory,
        clubAssociated: data.clubAssociated,
        clubsDetails: data.clubsDetails || [],
        instagramLink: data.instagramLink || '',
      });
      
      // Update local context so App.jsx guard knows the profile exists
      const updatedUser = { 
        ...user, 
        batting_style: data.battingStyle, 
        bowling_style: data.bowlingStyle, 
        height: data.height, 
        weight: data.weight 
      };
      setUser(updatedUser);
      localStorage.setItem('jws_user', JSON.stringify(updatedUser));

      navigate('/onboarding/step5');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error',
        text: err.response?.data?.message || 'Failed to save. Try again.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="heading-2">Player Profile</h2>
        <p className="text-small" style={{ marginTop: '0.5rem' }}>Help us understand your cricketing skills.</p>
        <div className="progress-container" style={{ marginTop: '1rem' }}>
          <div className="progress-bar" style={{ width: '75%' }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Social Media & Physical Stats */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>


          <Controller
            name="instagramLink"
            control={control}
            rules={{ required: 'Instagram Link is compulsory for tracking gameplay videos' }}
            render={({ field }) => (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Camera size={18} color="#E1306C" /> Instagram Link *
                </label>
                <input {...field} className="form-input" placeholder="https://instagram.com/yourprofile" />
                <span className="text-small" style={{ marginTop: '0.25rem', opacity: 0.7 }}>
                  Required for featured player gallery and video scrutiny
                </span>
                {errors.instagramLink && <span className="form-error">{errors.instagramLink.message}</span>}
              </div>
            )}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', alignItems: 'start' }}>
            <div className="form-group" style={{ justifyContent: 'flex-start' }}>
              <label className="form-label">Age</label>
              <input type="text" className="form-input" value={`${calculatedAge} Years`} disabled style={{ opacity: 0.7, backgroundColor: 'var(--bg-color)' }} />
              <span className="text-small" style={{ marginTop: '0.25rem', opacity: 0.5 }}>Auto-calculated</span>
            </div>
            
            <Controller
              name="height"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <div className="form-group" style={{ justifyContent: 'flex-start' }}>
                  <label className="form-label">Height (cm) *</label>
                  <input type="number" {...field} className="form-input" placeholder="e.g. 175" />
                  {errors.height && <span className="form-error">{errors.height.message}</span>}
                </div>
              )}
            />
            
            <Controller
              name="weight"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <div className="form-group" style={{ justifyContent: 'flex-start' }}>
                  <label className="form-label">Weight (kg) *</label>
                  <input type="number" {...field} className="form-input" placeholder="e.g. 70" />
                  {errors.weight && <span className="form-error">{errors.weight.message}</span>}
                </div>
              )}
            />
          </div>
        </div>

        {/* BCCI Styles */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>Playing Styles (BCCI Classifications)</h3>
          
          <Controller
            name="battingStyle"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Batting Style *</label>
                <select {...field} className="form-input">
                  <option value="">--Select--</option>
                  {battingStyles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                {errors.battingStyle && <span className="form-error">{errors.battingStyle.message}</span>}
              </div>
            )}
          />

          <Controller
            name="bowlingStyle"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <div className="form-group">
                <label className="form-label">Bowling Style *</label>
                <select {...field} className="form-input">
                  <option value="">--Select--</option>
                  {bowlingStyles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                {errors.bowlingStyle && <span className="form-error">{errors.bowlingStyle.message}</span>}
              </div>
            )}
          />
        </div>

        {/* Ball Selection */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>Ball Types Played With</h3>
          <p className="text-small" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Select all that apply.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
            {ballTypes.map((ball) => {
              const isSelected = watchBallsSelected.includes(ball.name);
              return (
                <div 
                  key={ball.name} 
                  onClick={() => toggleBall(ball.name)}
                  style={{
                    border: `2px solid ${isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(255,199,44,0.05)' : 'var(--bg-color)',
                    position: 'relative'
                  }}
                >
                  <img src={ball.imageUrl} alt={ball.name} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ball.name}</span>
                  {isSelected && <CheckCircle2 size={16} color="var(--brand-primary)" style={{ position: 'absolute', top: 5, right: 5 }} />}
                </div>
              );
            })}
            
            {/* None Option */}
            <div 
              onClick={() => toggleBall('none')}
              style={{
                border: `2px solid ${watchBallsSelected.includes('none') ? 'var(--brand-accent)' : 'var(--bg-surface-elevated)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: watchBallsSelected.includes('none') ? 'rgba(239,68,68,0.05)' : 'var(--bg-color)',
                gridColumn: '1 / -1' // Span full width if needed, or just let it flow
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>None of the above</span>
            </div>
          </div>
          {watchBallsSelected.length === 0 && <span className="form-error" style={{ display: 'block', marginTop: '0.5rem' }}>Please select at least one option.</span>}
        </div>

        {/* Field Positions */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>Preferred Fielding Positions</h3>
          
          <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--bg-surface-elevated)', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
            <div style={{ width: '100%', maxWidth: '350px', height: '350px', position: 'relative', overflow: 'auto', borderRadius: '8px', border: '1px solid var(--bg-surface-elevated)' }}>
              <div style={{ width: `${zoomLevel * 100}%`, height: `${zoomLevel * 100}%`, minWidth: '100%', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.2s, height 0.2s' }}>
                <img 
                  src="/images/field-map.png" 
                  alt="Cricket Field Positions" 
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-md)', 
                    display: 'block'
                  }} 
                />
              </div>
            </div>
            
            {/* Zoom Slider */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Zoom</span>
              <input 
                type="range" 
                min="1" 
                max="2.5" 
                step="0.1" 
                value={zoomLevel} 
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>

            <p className="text-small" style={{ color: 'var(--text-secondary)' }}>Click on the zones to select your preferred fielding positions.</p>
            
            <Controller
              name="fieldPositions"
              control={control}
              render={({ field }) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', width: '100%' }}>
                  {/* Predefined Positions */}
                  {fieldPositionsList.map(pos => {
                    const isSelected = (field.value || []).includes(pos.id);
                    return (
                      <div 
                        key={pos.id}
                        onClick={() => {
                          const newValue = isSelected 
                            ? (field.value || []).filter(v => v !== pos.id) 
                            : [...(field.value || []), pos.id];
                          field.onChange(newValue);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 'var(--radius-full)',
                          border: `1px solid ${isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)'}`,
                          backgroundColor: isSelected ? 'rgba(255,199,44,0.1)' : 'var(--bg-color)',
                          color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 600 : 400
                        }}
                      >
                        {pos.label}
                      </div>
                    )
                  })}
                  
                  {/* Custom Added Positions */}
                  {(field.value || []).filter(v => !fieldPositionsList.find(p => p.id === v)).map(custom => (
                    <div 
                      key={custom}
                      onClick={() => {
                        field.onChange((field.value || []).filter(v => v !== custom));
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid var(--brand-primary)`,
                        backgroundColor: 'rgba(255,199,44,0.1)',
                        color: 'var(--brand-primary)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {custom} (x)
                    </div>
                  ))}
                </div>
              )}
            />

            {/* Add Custom Position Input */}
            <div style={{ display: 'flex', width: '100%', marginTop: '0.5rem', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="E.g. Deep Extra Cover" 
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ width: 'auto' }}
                onClick={handleAddCustomPosition}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Cricket History */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>Cricket History</h3>
          <p className="text-small" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Enter the number of matches played at each level (Enter 0 if none).</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {watch('cricketHistory')?.map((item, index, arr) => {
              const show = index === 0 || (arr[index - 1] && Number(arr[index - 1].matches) > 0);
              if (!show) return null;

              return (
                <div key={item.level || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 600 }}>{item.level}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="text-small" style={{ color: 'var(--text-secondary)' }}>Matches:</span>
                    <Controller
                      name={`cricketHistory.${index}.matches`}
                      control={control}
                      render={({ field }) => (
                        <input 
                          type="number" 
                          {...field} 
                          className="form-input" 
                          style={{ width: '80px', padding: '0.5rem', textAlign: 'center' }} 
                          min="0"
                        />
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Club Details */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem', fontSize: '1rem', borderBottom: '1px solid var(--bg-surface-elevated)', paddingBottom: '0.5rem' }}>Club Details</h3>
          
          <Controller
            name="clubAssociated"
            control={control}
            render={({ field }) => (
              <div className="form-group">
                <label className="form-label">Are you associated with any club(s)?</label>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="radio" value="yes" checked={field.value === 'yes'} onChange={(e) => field.onChange(e.target.value)} /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="radio" value="no" checked={field.value === 'no'} onChange={(e) => {
                      field.onChange(e.target.value);
                      setValue('clubsDetails', []); // Clear clubs if no
                    }} /> No
                  </label>
                </div>
              </div>
            )}
          />

          {watchClubAssociated === 'yes' && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Select Club(s) & Permissions *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    {mockClubs.map(club => {
                      const currentClubs = watch('clubsDetails') || [];
                      const existingClub = currentClubs.find(c => c.name === club);
                      const isSelected = !!existingClub;
                      
                      return (
                        <div key={club} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--bg-surface-elevated)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => toggleClub(club)} 
                              style={{ accentColor: 'var(--brand-primary)' }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 400 }}>{club}</span>
                          </label>

                          {isSelected && (
                            <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span className="text-small" style={{ color: 'var(--text-secondary)' }}>Are you allowed to play outside this club?</span>
                              <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                  <input 
                                    type="radio" 
                                    name={`outside-${club}`} 
                                    checked={existingClub.allowedOutside === 'yes'} 
                                    onChange={() => updateClubPermission(club, 'yes')} 
                                    style={{ accentColor: 'var(--brand-primary)' }}
                                  /> Yes
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                  <input 
                                    type="radio" 
                                    name={`outside-${club}`} 
                                    checked={existingClub.allowedOutside === 'no'} 
                                    onChange={() => updateClubPermission(club, 'no')} 
                                    style={{ accentColor: 'var(--brand-primary)' }}
                                  /> No
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {(watch('clubsDetails') || []).length === 0 && <span className="form-error" style={{ marginTop: '0.5rem', display: 'block' }}>Please select at least one club.</span>}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={submitting || watchBallsSelected.length === 0 || (watchClubAssociated === 'yes' && (watch('clubsDetails') || []).length === 0)}>
          {submitting ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>
    </motion.div>
  );
};

export default Step4_PlayerProfile;

